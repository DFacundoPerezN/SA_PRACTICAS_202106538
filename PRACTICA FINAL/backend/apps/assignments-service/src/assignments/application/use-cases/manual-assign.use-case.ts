import {
  Inject, Injectable,
  NotFoundException, ConflictException,
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

export interface ManualAssignInput {
  ticketId:     string;
  technicianId: string;
  assignedBy:   string;
  notes?:       string;
}

@Injectable()
export class ManualAssignUseCase {
  constructor(
    @Inject(ASSIGNMENT_REPOSITORY)    private readonly assignRepo:      IAssignmentRepository,
    @Inject(ASSIGNMENT_EVENT_PUBLISHER) private readonly publisher:     IAssignmentEventPublisher,
    @Inject(TICKETS_GRPC_CLIENT_TOKEN) private readonly ticketsClient:  ITicketsGrpcClient,
  ) {}

  async execute(input: ManualAssignInput): Promise<AssignmentEntity> {
    // Check if ticket already has an active assignment
    const existing = await this.assignRepo.findByTicket(input.ticketId);
    if (existing && ['asignado', 'reasignado'].includes(existing.status?.name ?? '')) {
      throw new ConflictException(
        `Ticket ${input.ticketId} already has an active assignment. Use PATCH to reassign.`,
      );
    }

    const assignedStatus = await this.assignRepo.findStatusByName('asignado');
    if (!assignedStatus) throw new NotFoundException('Assignment status "asignado" not found');

    const assignment = await this.assignRepo.createAssignment({
      id:           randomUUID(),
      ticketId:     input.ticketId,
      technicianId: input.technicianId,
      assignedBy:   input.assignedBy,
      statusId:     assignedStatus.id,
      notes:        input.notes ?? null,
    });

    // Increment workload counter for the technician
    await this.assignRepo.upsertWorkload(input.technicianId, +1);

    // RF-11: update assigned_to on the ticket (gRPC call to tickets-service)
    await this.ticketsClient.assignTicket({
      ticketId:     input.ticketId,
      technicianId: input.technicianId,
      assignedBy:   input.assignedBy,
    }).catch(() => { /* tickets-service will retry on reconnect; non-blocking */ });

    // RF-16: publish ticket.assigned event (fire-and-forget)
    this.publisher.publishAssignmentCreated({
      assignmentId: assignment.id,
      ticketId:     assignment.ticketId,
      technicianId: assignment.technicianId,
      assignedBy:   assignment.assignedBy,
      assignedAt:   assignment.assignedAt.toISOString(),
      isAutomatic:  false,
    }).catch(() => { /* logged inside publisher */ });

    return assignment;
  }
}
