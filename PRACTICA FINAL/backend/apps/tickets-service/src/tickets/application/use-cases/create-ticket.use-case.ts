import { Inject, Injectable, BadRequestException } from '@nestjs/common';
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

export interface CreateTicketInput {
  title:       string;
  description: string;
  categoryId:  number;
  priorityId:  number;
  createdBy:   string;
}

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepo: ITicketRepository,
    @Inject(EVENT_PUBLISHER)   private readonly publisher:  IEventPublisher,
  ) {}

  async execute(input: CreateTicketInput): Promise<TicketEntity> {
    // Validate FK references exist
    const category = await this.ticketRepo.findCategoryById(input.categoryId);
    if (!category) {
      throw new BadRequestException(`Category ${input.categoryId} does not exist`);
    }

    const priority = await this.ticketRepo.findPriorityById(input.priorityId);
    if (!priority) {
      throw new BadRequestException(`Priority ${input.priorityId} does not exist`);
    }

    const ticket = await this.ticketRepo.createTicket({
      id:          randomUUID(),
      title:       input.title,
      description: input.description,
      categoryId:  input.categoryId,
      priorityId:  input.priorityId,
      createdBy:   input.createdBy,
    });

    // RF-15: publish ticket.created (fire-and-forget, never blocks the response)
    this.publisher.publishTicketCreated({
      ticketId:   ticket.id,
      title:      ticket.title,
      categoryId: ticket.categoryId,
      priorityId: ticket.priorityId,
      createdBy:  ticket.createdBy,
      createdAt:  ticket.createdAt.toISOString(),
    }).catch(() => { /* logged inside publisher */ });

    return ticket;
  }
}
