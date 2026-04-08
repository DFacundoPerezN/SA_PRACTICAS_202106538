import {
  Inject, Injectable, Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  ASSIGNMENT_REPOSITORY,
} from '../interfaces/assignment-repository.interface';
import type { IAssignmentRepository } from '../interfaces/assignment-repository.interface';
import {
  ASSIGNMENT_EVENT_PUBLISHER,
} from '../interfaces/event-publisher.interface';
import type { IAssignmentEventPublisher } from '../interfaces/event-publisher.interface';
import {
  TICKETS_GRPC_CLIENT_TOKEN,
} from '../interfaces/tickets-grpc-client.interface';
import type { ITicketsGrpcClient } from '../interfaces/tickets-grpc-client.interface';
import { AssignmentEntity } from '../../domain/assignment.entity';

export interface TicketCreatedEvent {
  ticketId:   string;
  title:      string;
  categoryId: number;
  priorityId: number;
  createdBy:  string;
  createdAt:  string;
}

@Injectable()
export class AutoAssignUseCase {
  private readonly logger = new Logger(AutoAssignUseCase.name);

  constructor(
    @Inject(ASSIGNMENT_REPOSITORY)      private readonly assignRepo:    IAssignmentRepository,
    @Inject(ASSIGNMENT_EVENT_PUBLISHER) private readonly publisher:     IAssignmentEventPublisher,
    @Inject(TICKETS_GRPC_CLIENT_TOKEN)  private readonly ticketsClient: ITicketsGrpcClient,
  ) {}

  /**
   * RF-18: Attempt automatic assignment to the technician with the lowest
   * active_tickets count (RF-22 workload balancing).
   * If no technician is available, the ticket stays unassigned — this is not
   * an error condition, it simply waits for a manual assignment.
   */
  async execute(event: TicketCreatedEvent): Promise<AssignmentEntity | null> {
    this.logger.log(`Auto-assign triggered for ticket ${event.ticketId}`);

    // RF-22: pick technician with lowest active workload
    const workload = await this.assignRepo.getWorkload();

    if (workload.length === 0) {
      this.logger.warn(`No technicians in workload table — skipping auto-assign for ticket ${event.ticketId}`);
      return null;
    }

    // Sort ascending by active_tickets; pick the one with the least load
    const sorted = [...workload].sort((a, b) => a.activeTickets - b.activeTickets);
    const chosen = sorted[0];

    this.logger.log(
      `Auto-assigning ticket ${event.ticketId} to technician ${chosen.technicianId} ` +
      `(active=${chosen.activeTickets})`,
    );

    const assignedStatus = await this.assignRepo.findStatusByName('asignado');
    if (!assignedStatus) {
      this.logger.error('Assignment status "asignado" not found — aborting auto-assign');
      return null;
    }

    const assignment = await this.assignRepo.createAssignment({
      id:           randomUUID(),
      ticketId:     event.ticketId,
      technicianId: chosen.technicianId,
      assignedBy:   null,       // null signals it was done by the system
      statusId:     assignedStatus.id,
      notes:        'Asignación automática por carga de trabajo',
    });

    // Increment workload counter
    await this.assignRepo.upsertWorkload(chosen.technicianId, +1);

    // Update assigned_to on the ticket (non-blocking)
    this.ticketsClient.assignTicket({
      ticketId:     event.ticketId,
      technicianId: chosen.technicianId,
      assignedBy:   'system',
    }).catch((err: Error) =>
      this.logger.error(`Failed to update ticket assignment: ${err.message}`),
    );

    // Publish ticket.assigned event (fire-and-forget)
    this.publisher.publishAssignmentCreated({
      assignmentId: assignment.id,
      ticketId:     assignment.ticketId,
      technicianId: assignment.technicianId,
      assignedBy:   null,
      assignedAt:   assignment.assignedAt.toISOString(),
      isAutomatic:  true,
    }).catch(() => { /* logged inside publisher */ });

    return assignment;
  }
}
