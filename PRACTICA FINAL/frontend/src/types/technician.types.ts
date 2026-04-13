import type { TicketStatus, TicketPriority } from './ticket.types';

// ─── Tickets (técnico) ────────────────────────────────────────────────────────

/** Item del listado de tickets para técnico (GET /api/tickets) */
export interface TechnicianTicketListItem {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

/** Respuesta paginada de GET /api/tickets */
export interface TechnicianTicketsResponse {
  tickets: TechnicianTicketListItem[];
  total: number;
}

/** Filtros para GET /api/tickets */
export interface TicketFilters {
  status?: TicketStatus;
  priority_id?: 1 | 2 | 3 | 4;
  category_id?: 1 | 2 | 3 | 4 | 5 | 6;
  assigned_to?: string;
  created_by?: string;
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
  updated_at: string;
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
  ticket_id: string;
  technician_id: string;
  status: AssignmentStatus;
  assigned_at: string;
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
