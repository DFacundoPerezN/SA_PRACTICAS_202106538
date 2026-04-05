import { Injectable } from '@nestjs/common';
import { CreateTicketUseCase, CreateTicketInput }   from './use-cases/create-ticket.use-case';
import { FindTicketUseCase }                        from './use-cases/find-ticket.use-case';
import { UpdateTicketUseCase, UpdateTicketInput }   from './use-cases/update-ticket.use-case';
import { ChangeStatusUseCase, ChangeStatusInput }   from './use-cases/change-status.use-case';
import { AssignTicketUseCase, AssignTicketInput }   from './use-cases/assign-ticket.use-case';
import { AddCommentUseCase, AddCommentInput }       from './use-cases/add-comment.use-case';
import { AutoCloseTicketsUseCase }                  from './use-cases/auto-close-tickets.use-case';
import {
  FindTicketsFilter,
  FindMyTicketsFilter,
  SearchFilter,
} from './interfaces/ticket-repository.interface';
import { TicketEntity }        from '../domain/ticket.entity';
import { TicketHistoryEntity } from '../domain/ticket-history.entity';
import { CommentEntity }       from '../domain/comment.entity';

@Injectable()
export class TicketsService {
  constructor(
    private readonly createTicketUseCase:   CreateTicketUseCase,
    private readonly findTicketUseCase:     FindTicketUseCase,
    private readonly updateTicketUseCase:   UpdateTicketUseCase,
    private readonly changeStatusUseCase:   ChangeStatusUseCase,
    private readonly assignTicketUseCase:   AssignTicketUseCase,
    private readonly addCommentUseCase:     AddCommentUseCase,
    private readonly autoCloseUseCase:      AutoCloseTicketsUseCase,
  ) {}

  createTicket(input: CreateTicketInput): Promise<TicketEntity> {
    return this.createTicketUseCase.execute(input);
  }

  findById(id: string): Promise<{ ticket: TicketEntity; history: TicketHistoryEntity[] }> {
    return this.findTicketUseCase.findById(id);
  }

  findTickets(filter: FindTicketsFilter): Promise<{ tickets: TicketEntity[]; total: number }> {
    return this.findTicketUseCase.findTickets(filter);
  }

  findMyTickets(filter: FindMyTicketsFilter): Promise<{ tickets: TicketEntity[]; total: number }> {
    return this.findTicketUseCase.findMyTickets(filter);
  }

  updateTicket(input: UpdateTicketInput): Promise<TicketEntity> {
    return this.updateTicketUseCase.execute(input);
  }

  changeStatus(input: ChangeStatusInput): Promise<TicketEntity> {
    return this.changeStatusUseCase.execute(input);
  }

  assignTicket(input: AssignTicketInput): Promise<TicketEntity> {
    return this.assignTicketUseCase.execute(input);
  }

  addComment(input: AddCommentInput): Promise<CommentEntity> {
    return this.addCommentUseCase.execute(input);
  }

  findComments(ticketId: string, includeInternal: boolean): Promise<CommentEntity[]> {
    return this.findTicketUseCase.findComments(ticketId, includeInternal);
  }

  searchTickets(filter: SearchFilter): Promise<{ tickets: TicketEntity[]; total: number }> {
    return this.findTicketUseCase.searchTickets(filter);
  }

  autoCloseStaleTickets(): Promise<number> {
    return this.autoCloseUseCase.execute();
  }
}
