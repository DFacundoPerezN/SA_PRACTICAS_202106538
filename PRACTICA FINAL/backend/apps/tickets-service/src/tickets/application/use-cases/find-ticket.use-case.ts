import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  TICKET_REPOSITORY,
} from '../interfaces/ticket-repository.interface';
import type {
  ITicketRepository,
  FindTicketsFilter,
  FindMyTicketsFilter,
  SearchFilter,
} from '../interfaces/ticket-repository.interface';
import { TicketEntity }        from '../../domain/ticket.entity';
import { TicketHistoryEntity } from '../../domain/ticket-history.entity';
import { CommentEntity }       from '../../domain/comment.entity';

@Injectable()
export class FindTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY) private readonly ticketRepo: ITicketRepository,
  ) {}

  async findById(id: string): Promise<{ ticket: TicketEntity; history: TicketHistoryEntity[] }> {
    const ticket = await this.ticketRepo.findById(id);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);

    const history = await this.ticketRepo.findHistory(id);
    return { ticket, history };
  }

  findTickets(filter: FindTicketsFilter): Promise<{ tickets: TicketEntity[]; total: number }> {
    return this.ticketRepo.findTickets(filter);
  }

  findMyTickets(filter: FindMyTicketsFilter): Promise<{ tickets: TicketEntity[]; total: number }> {
    return this.ticketRepo.findMyTickets(filter);
  }

  findComments(ticketId: string, includeInternal: boolean): Promise<CommentEntity[]> {
    return this.ticketRepo.findComments(ticketId, includeInternal);
  }

  searchTickets(filter: SearchFilter): Promise<{ tickets: TicketEntity[]; total: number }> {
    return this.ticketRepo.searchTickets(filter);
  }
}
