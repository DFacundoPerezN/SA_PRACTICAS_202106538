import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { TicketsService } from './application/tickets.service';
import { toTicketResponse, toHistoryEntry, toCommentResponse } from './tickets.mapper';

@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ── RF-06 ────────────────────────────────────────────────────────────────
  @GrpcMethod('TicketsService', 'CreateTicket')
  async createTicket(data: {
    title: string; description: string;
    categoryId: number; priorityId: number; createdBy: string;
  }) {
    const ticket = await this.ticketsService.createTicket({
      title:       data.title,
      description: data.description,
      categoryId:  data.categoryId,
      priorityId:  data.priorityId,
      createdBy:   data.createdBy,
    });
    return toTicketResponse(ticket);
  }

  // ── RF-08 ────────────────────────────────────────────────────────────────
  @GrpcMethod('TicketsService', 'FindTicketById')
  async findTicketById(data: { id: string }) {
    const { ticket, history } = await this.ticketsService.findById(data.id);
    return {
      ticket:  toTicketResponse(ticket),
      history: history.map(toHistoryEntry),
    };
  }

  // ── RF-07 ────────────────────────────────────────────────────────────────
  @GrpcMethod('TicketsService', 'FindTickets')
  async findTickets(data: {
    status?: string; priorityId?: number; categoryId?: number;
    assignedTo?: string; createdBy?: string; from?: string; to?: string;
    page?: number; limit?: number;
  }) {
    const { tickets, total } = await this.ticketsService.findTickets({
      status:     data.status     || undefined,
      priorityId: data.priorityId || undefined,
      categoryId: data.categoryId || undefined,
      assignedTo: data.assignedTo || undefined,
      createdBy:  data.createdBy  || undefined,
      from:       data.from       || undefined,
      to:         data.to         || undefined,
      page:       data.page       || 1,
      limit:      data.limit      || 20,
    });
    return { tickets: tickets.map(toTicketResponse), total, page: data.page || 1, limit: data.limit || 20 };
  }

  // ── RF-07 (own tickets) ──────────────────────────────────────────────────
  @GrpcMethod('TicketsService', 'FindMyTickets')
  async findMyTickets(data: {
    userId: string; status?: string; page?: number; limit?: number;
  }) {
    const { tickets, total } = await this.ticketsService.findMyTickets({
      userId: data.userId,
      status: data.status || undefined,
      page:   data.page   || 1,
      limit:  data.limit  || 20,
    });
    return { tickets: tickets.map(toTicketResponse), total, page: data.page || 1, limit: data.limit || 20 };
  }

  // ── RF-09 ────────────────────────────────────────────────────────────────
  @GrpcMethod('TicketsService', 'UpdateTicket')
  async updateTicket(data: {
    id: string; description?: string; priorityId?: number;
    categoryId?: number; changedBy: string;
  }) {
    const ticket = await this.ticketsService.updateTicket({
      id:          data.id,
      description: data.description || undefined,
      priorityId:  data.priorityId  || undefined,
      categoryId:  data.categoryId  || undefined,
      changedBy:   data.changedBy,
    });
    return toTicketResponse(ticket);
  }

  // ── RF-10, RF-17 ─────────────────────────────────────────────────────────
  @GrpcMethod('TicketsService', 'ChangeStatus')
  async changeStatus(data: { id: string; status: string; changedBy: string }) {
    const ticket = await this.ticketsService.changeStatus({
      ticketId:  data.id,
      newStatus: data.status,
      changedBy: data.changedBy,
    });
    return toTicketResponse(ticket);
  }

  // ── RF-11, RF-16 ─────────────────────────────────────────────────────────
  @GrpcMethod('TicketsService', 'AssignTicket')
  async assignTicket(data: {
    ticketId: string; technicianId: string; assignedBy: string;
  }) {
    const ticket = await this.ticketsService.assignTicket({
      ticketId:     data.ticketId,
      technicianId: data.technicianId,
      assignedBy:   data.assignedBy,
    });
    return toTicketResponse(ticket);
  }

  // ── RF-12 ────────────────────────────────────────────────────────────────
  @GrpcMethod('TicketsService', 'AddComment')
  async addComment(data: {
    ticketId: string; authorId: string; content: string; isInternal: boolean;
  }) {
    const comment = await this.ticketsService.addComment({
      ticketId:   data.ticketId,
      authorId:   data.authorId,
      content:    data.content,
      isInternal: data.isInternal ?? false,
    });
    return toCommentResponse(comment);
  }

  @GrpcMethod('TicketsService', 'FindComments')
  async findComments(data: { ticketId: string; includeInternal: boolean }) {
    const comments = await this.ticketsService.findComments(
      data.ticketId,
      data.includeInternal ?? false,
    );
    return { comments: comments.map(toCommentResponse), total: comments.length };
  }

  // ── RF-13 ────────────────────────────────────────────────────────────────
  @GrpcMethod('TicketsService', 'SearchTickets')
  async searchTickets(data: {
    query: string; status?: string; priorityId?: number;
    categoryId?: number; page?: number; limit?: number;
  }) {
    const { tickets, total } = await this.ticketsService.searchTickets({
      query:      data.query,
      status:     data.status     || undefined,
      priorityId: data.priorityId || undefined,
      categoryId: data.categoryId || undefined,
      page:       data.page       || 1,
      limit:      data.limit      || 20,
    });
    return { tickets: tickets.map(toTicketResponse), total, page: data.page || 1, limit: data.limit || 20 };
  }
}
