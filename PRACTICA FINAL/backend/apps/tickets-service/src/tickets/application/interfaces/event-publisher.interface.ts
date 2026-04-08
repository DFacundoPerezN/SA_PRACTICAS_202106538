// Abstraction over RabbitMQ (or any future broker).
// Use cases depend only on this interface — never on RabbitMQ directly (DIP).

export interface TicketCreatedPayload {
  ticketId:   string;
  title:      string;
  categoryId: number;
  priorityId: number;
  createdBy:  string;
  createdAt:  string;
}

export interface TicketAssignedPayload {
  ticketId:     string;
  technicianId: string;
  assignedBy:   string;
  assignedAt:   string;
}

export interface TicketStatusUpdatedPayload {
  ticketId:  string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
}

export interface IEventPublisher {
  publishTicketCreated(payload: TicketCreatedPayload): Promise<void>;
  publishTicketAssigned(payload: TicketAssignedPayload): Promise<void>;
  publishTicketStatusUpdated(payload: TicketStatusUpdatedPayload): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('IEventPublisher');
