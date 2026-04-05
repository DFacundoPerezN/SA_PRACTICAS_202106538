import {
  Inject, Injectable,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  TICKET_REPOSITORY,
} from '../interfaces/ticket-repository.interface';
import type { ITicketRepository } from '../interfaces/ticket-repository.interface';
import {
  EVENT_PUBLISHER,
} from '../interfaces/event-publisher.interface';
import type { IEventPublisher } from '../interfaces/event-publisher.interface';
import { TicketEntity } from '../../domain/ticket.entity';

// ── State machine definition ────────────────────────────────────────────────
// Keys are current status names; values are the set of allowed next statuses.
const VALID_TRANSITIONS: Record<string, string[]> = {
  abierto:     ['en_progreso'],
  en_progreso: ['resuelto'],
  resuelto:    ['cerrado', 'reabierto'],
  cerrado:     ['reabierto'],
  reabierto:   ['en_progreso'],
};

export interface ChangeStatusInput {
  ticketId:  string;
  newStatus: string;
  changedBy: string;
}

@Injectable()
export class ChangeStatusUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepo: ITicketRepository,
    @Inject(EVENT_PUBLISHER)   private readonly publisher:  IEventPublisher,
  ) {}

  async execute(input: ChangeStatusInput): Promise<TicketEntity> {
    const ticket = await this.ticketRepo.findById(input.ticketId);
    if (!ticket) throw new NotFoundException(`Ticket ${input.ticketId} not found`);

    const currentStatus = ticket.status?.name;
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(input.newStatus)) {
      throw new BadRequestException(
        `Cannot transition from '${currentStatus}' to '${input.newStatus}'. ` +
        `Allowed: [${allowed.join(', ')}]`,
      );
    }

    const newStatusEntity = await this.ticketRepo.findStatusByName(input.newStatus);
    if (!newStatusEntity) throw new BadRequestException(`Status '${input.newStatus}' not found`);

    // Build optional timestamp fields
    const extra: Partial<Pick<TicketEntity, 'resolvedAt' | 'closedAt'>> = {};
    if (input.newStatus === 'resuelto')  extra.resolvedAt = new Date();
    if (input.newStatus === 'cerrado')   extra.closedAt   = new Date();

    const updated = await this.ticketRepo.updateStatus(input.ticketId, newStatusEntity.id, extra);

    // Audit trail
    await this.ticketRepo.addHistory({
      id:           randomUUID(),
      ticketId:     input.ticketId,
      changedBy:    input.changedBy,
      fieldChanged: 'status',
      oldValue:     currentStatus,
      newValue:     input.newStatus,
    });

    // RF-17: publish ticket.status.updated (fire-and-forget)
    this.publisher.publishTicketStatusUpdated({
      ticketId:  ticket.id,
      oldStatus: currentStatus,
      newStatus: input.newStatus,
      changedBy: input.changedBy,
      changedAt: new Date().toISOString(),
    }).catch(() => { /* logged inside publisher */ });

    return updated;
  }
}
