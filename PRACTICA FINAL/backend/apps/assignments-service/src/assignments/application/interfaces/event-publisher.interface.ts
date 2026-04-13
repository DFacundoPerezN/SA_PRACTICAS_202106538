// Assignments publishes ticket.assigned after every successful assignment.
// Use cases depend on this interface, never on RabbitMQ directly (DIP).

export interface AssignmentCreatedPayload {
  assignmentId: string;
  ticketId:     string;
  technicianId: string;
  assignedBy:   string | null;
  assignedAt:   string;
  isAutomatic:  boolean;
}

export interface IAssignmentEventPublisher {
  publishAssignmentCreated(payload: AssignmentCreatedPayload): Promise<void>;
}

export const ASSIGNMENT_EVENT_PUBLISHER = Symbol('IAssignmentEventPublisher');
