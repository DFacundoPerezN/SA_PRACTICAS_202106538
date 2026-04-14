import type { TicketStatus, TicketPriority } from './ticket.types';

// ─── Tickets (técnico) ────────────────────────────────────────────────────────

export interface TicketByIdAssignment {
  ticket: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    createdBy: string;
    assignedTo: string | null;
    resolvedAt?: string | null;
    closedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  history: {
    id: string;
    fieldChanged: string;
    oldValue: string;
    newValue: string;
    changedBy: string;
    changedAt: string;
  }[];
}

/** Item del listado de tickets para técnico (GET /api/tickets) */
export interface TechnicianTicketListItem {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Respuesta paginada de GET /api/tickets */
export interface TechnicianTicketsResponse {
  tickets: TechnicianTicketListItem[];
  total: number;
}

/** Filtros para GET /api/tickets */
export interface TicketFilters {
  status?: TicketStatus;
  priorityId?: 1 | 2 | 3 | 4;
  categoryId?: 1 | 2 | 3 | 4 | 5 | 6;
  assignedTo?: string;
  createdBy?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/** Body de PATCH /api/tickets/:id */
export interface UpdateTicketPayload {
  description?: string;
  priority_id?: 1 | 2 | 3 | 4;
  category_id?: 1 | 2 | 3 | 4 | 5 | 6;
}

/** Body de PATCH /api/tickets/:id/status */
export interface UpdateTicketStatusPayload {
  status: 'en_progreso' | 'resuelto' | 'cerrado' | 'reabierto';
}

/** Respuesta de PATCH /api/tickets/:id/status */
export interface UpdateTicketStatusResponse {
  id: string;
  status: TicketStatus;
  updatedAt: string;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export type AssignmentStatus = 'pendiente' | 'asignado' | 'reasignado' | 'cerrado';

export interface Assignment {
  id: string;
  ticket_id: string;
  technician_id: string;
  assigned_by?: string;
  status: AssignmentStatus;
  notes?: string | null;
  assigned_at: string;
  closed_at?: string | null;
}

/** Respuesta de GET /api/assignments/ticket/:ticket_id */
export interface TicketAssignmentResponse {
  id: string;
  ticketId: string;
  technicianId: string;
  status: AssignmentStatus;
  assignedAt: string;
}

/** Respuesta de GET /api/assignments/technician/:technician_id */
export interface TechnicianAssignmentsResponse {
  assignments: Assignment[];
  total: number;
}

// ─── Comments (técnico) ───────────────────────────────────────────────────────

/** Body de POST /api/tickets/:id/comments (técnico puede enviar internos) */
export interface TechnicianCreateCommentPayload {
  content: string;
  is_internal: boolean;
}
