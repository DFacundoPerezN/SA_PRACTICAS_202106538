import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  TICKET_REPOSITORY,
} from '../interfaces/ticket-repository.interface';
import type { ITicketRepository } from '../interfaces/ticket-repository.interface';
import { TicketEntity } from '../../domain/ticket.entity';

export interface UpdateTicketInput {
  id:           string;
  description?: string;
  priorityId?:  number;
  categoryId?:  number;
  changedBy:    string;
}

@Injectable()
export class UpdateTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepo: ITicketRepository,
  ) {}

  async execute(input: UpdateTicketInput): Promise<TicketEntity> {
    const existing = await this.ticketRepo.findById(input.id);
    if (!existing) throw new NotFoundException(`Ticket ${input.id} not found`);

    const data: Partial<Pick<TicketEntity, 'description' | 'priorityId' | 'categoryId'>> = {};
    const historyEntries: Array<{ field: string; oldValue: string; newValue: string }> = [];

    if (input.description !== undefined && input.description !== existing.description) {
      data.description = input.description;
      historyEntries.push({ field: 'description', oldValue: existing.description, newValue: input.description });
    }

    if (input.priorityId !== undefined && input.priorityId !== existing.priorityId) {
      const priority = await this.ticketRepo.findPriorityById(input.priorityId);
      if (!priority) throw new BadRequestException(`Priority ${input.priorityId} does not exist`);
      data.priorityId = input.priorityId;
      historyEntries.push({
        field: 'priority',
        oldValue: String(existing.priorityId),
        newValue: String(input.priorityId),
      });
    }

    if (input.categoryId !== undefined && input.categoryId !== existing.categoryId) {
      const category = await this.ticketRepo.findCategoryById(input.categoryId);
      if (!category) throw new BadRequestException(`Category ${input.categoryId} does not exist`);
      data.categoryId = input.categoryId;
      historyEntries.push({
        field: 'category',
        oldValue: String(existing.categoryId),
        newValue: String(input.categoryId),
      });
    }

    const updated = await this.ticketRepo.updateTicket(input.id, data);

    // Persist audit trail for each changed field
    for (const entry of historyEntries) {
      await this.ticketRepo.addHistory({
        id:           randomUUID(),
        ticketId:     input.id,
        changedBy:    input.changedBy,
        fieldChanged: entry.field,
        oldValue:     entry.oldValue,
        newValue:     entry.newValue,
      });
    }

    return updated;
  }
}
