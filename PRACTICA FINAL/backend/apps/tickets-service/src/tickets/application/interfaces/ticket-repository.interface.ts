import { TicketEntity }        from '../../domain/ticket.entity';
import { CommentEntity }       from '../../domain/comment.entity';
import { TicketHistoryEntity } from '../../domain/ticket-history.entity';
import { TicketStatusEntity }  from '../../domain/ticket-status.entity';
import { CategoryEntity }      from '../../domain/category.entity';
import { PriorityEntity }      from '../../domain/priority.entity';

// ── Filter/Option types ──────────────────────────────────────────────────────

export interface FindTicketsFilter {
  status?:      string;
  priorityId?:  number;
  categoryId?:  number;
  assignedTo?:  string;
  createdBy?:   string;
  from?:        string;
  to?:          string;
  page:         number;
  limit:        number;
}

export interface FindMyTicketsFilter {
  userId:   string;
  status?:  string;
  page:     number;
  limit:    number;
}

export interface SearchFilter {
  query:      string;
  status?:    string;
  priorityId?: number;
  categoryId?: number;
  page:       number;
  limit:      number;
}

// ── Repository contract ──────────────────────────────────────────────────────

export interface ITicketRepository {
  // Tickets
  createTicket(data: {
    id:          string;
    title:       string;
    description: string;
    categoryId:  number;
    priorityId:  number;
    createdBy:   string;
  }): Promise<TicketEntity>;

  findById(id: string): Promise<TicketEntity | null>;
  findTickets(filter: FindTicketsFilter): Promise<{ tickets: TicketEntity[]; total: number }>;
  findMyTickets(filter: FindMyTicketsFilter): Promise<{ tickets: TicketEntity[]; total: number }>;
  updateTicket(id: string, data: Partial<Pick<TicketEntity, 'description' | 'priorityId' | 'categoryId'>>): Promise<TicketEntity>;
  updateStatus(id: string, statusId: number, extra?: Partial<Pick<TicketEntity, 'resolvedAt' | 'closedAt'>>): Promise<TicketEntity>;
  assignTicket(id: string, technicianId: string): Promise<TicketEntity>;
  searchTickets(filter: SearchFilter): Promise<{ tickets: TicketEntity[]; total: number }>;

  // Resolved tickets older than X days (for auto-close)
  findStaleResolved(olderThanDays: number): Promise<TicketEntity[]>;

  // Lookup helpers
  findStatusByName(name: string): Promise<TicketStatusEntity | null>;
  findStatusById(id: number): Promise<TicketStatusEntity | null>;
  findCategoryById(id: number): Promise<CategoryEntity | null>;
  findPriorityById(id: number): Promise<PriorityEntity | null>;

  // History
  addHistory(data: {
    id:           string;
    ticketId:     string;
    changedBy:    string;
    fieldChanged: string;
    oldValue:     string | null;
    newValue:     string | null;
  }): Promise<TicketHistoryEntity>;

  findHistory(ticketId: string): Promise<TicketHistoryEntity[]>;

  // Comments
  addComment(data: {
    id:         string;
    ticketId:   string;
    authorId:   string;
    content:    string;
    isInternal: boolean;
  }): Promise<CommentEntity>;

  findComments(ticketId: string, includeInternal: boolean): Promise<CommentEntity[]>;
}

export const TICKET_REPOSITORY = Symbol('ITicketRepository');
