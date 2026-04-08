import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TICKET_REPOSITORY } from '../interfaces/ticket-repository.interface';
import type { ITicketRepository } from '../interfaces/ticket-repository.interface';
import { EVENT_PUBLISHER } from '../interfaces/event-publisher.interface';
import type { IEventPublisher } from '../interfaces/event-publisher.interface';
import { TicketEntity } from '../../domain/ticket.entity';

export interface AssignTicketInput {
  ticketId:     string;
  technicianId: string;
  assignedBy:   string;
}

@Injectable()
export class AssignTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepo: ITicketRepository,
    @Inject(EVENT_PUBLISHER)   private readonly publisher:  IEventPublisher,
  ) {}

  async execute(input: AssignTicketInput): Promise<TicketEntity> {
    const ticket = await this.ticketRepo.findById(input.ticketId);
    if (!ticket) throw new NotFoundException(`Ticket ${input.ticketId} not found`);

    const oldAssignee = ticket.assignedTo;
    const updated = await this.ticketRepo.assignTicket(input.ticketId, input.technicianId);

    // Audit trail
    await this.ticketRepo.addHistory({
      id:           randomUUID(),
      ticketId:     input.ticketId,
      changedBy:    input.assignedBy,
      fieldChanged: 'assigned_to',
      oldValue:     oldAssignee,
      newValue:     input.technicianId,
    });

    // RF-16: publish ticket.assigned (fire-and-forget)
    this.publisher.publishTicketAssigned({
      ticketId:     ticket.id,
      technicianId: input.technicianId,
      assignedBy:   input.assignedBy,
      assignedAt:   new Date().toISOString(),
    }).catch(() => { /* logged inside publisher */ });

    return updated;
  }
}
