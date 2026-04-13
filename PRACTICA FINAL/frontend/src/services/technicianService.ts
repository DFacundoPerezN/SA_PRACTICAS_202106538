import { authFetch } from '../utils/authFetch';
import { CONFIG } from '../config/config';
import type { Ticket, CommentsResponse, Comment } from '../types/ticket.types';
import type {
  TechnicianTicketsResponse,
  TicketFilters,
  UpdateTicketPayload,
  UpdateTicketStatusPayload,
  UpdateTicketStatusResponse,
  TicketAssignmentResponse,
  TechnicianAssignmentsResponse,
  TechnicianCreateCommentPayload,
} from '../types/technician.types';

const TICKETS_BASE = `${CONFIG.API_URL}/api/tickets`;
const ASSIGNMENTS_BASE = `${CONFIG.API_URL}/api/assignments`;

// ─── Listado de tickets (técnico/admin) ───────────────────────────────────────

/**
 * GET /api/tickets
 * Lista todos los tickets con filtros opcionales. Requiere rol técnico o admin.
 */
export const getTechnicianTickets = async (
  filters: TicketFilters = {},
): Promise<TechnicianTicketsResponse> => {
  const params = new URLSearchParams();

  if (filters.status)      params.set('status',      filters.status);
  if (filters.priority_id) params.set('priority_id', String(filters.priority_id));
  if (filters.category_id) params.set('category_id', String(filters.category_id));
  if (filters.assigned_to) params.set('assigned_to', filters.assigned_to);
  if (filters.created_by)  params.set('created_by',  filters.created_by);
  if (filters.from)        params.set('from',         filters.from);
  if (filters.to)          params.set('to',           filters.to);
  if (filters.page)        params.set('page',         String(filters.page));
  if (filters.limit)       params.set('limit',        String(filters.limit));

  const url = params.toString()
    ? `${TICKETS_BASE}?${params.toString()}`
    : TICKETS_BASE;

  const response = await authFetch(url);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al cargar los tickets');
  }

  return response.json();
};

// ─── Búsqueda fulltext ────────────────────────────────────────────────────────

/**
 * GET /api/tickets/search?q=...
 * Búsqueda fulltext sobre title y description.
 */
export const searchTickets = async (
  q: string,
  filters: Omit<TicketFilters, 'assigned_to' | 'created_by' | 'from' | 'to'> = {},
): Promise<TechnicianTicketsResponse> => {
  const params = new URLSearchParams({ q });

  if (filters.status)      params.set('status',      filters.status);
  if (filters.priority_id) params.set('priority_id', String(filters.priority_id));
  if (filters.category_id) params.set('category_id', String(filters.category_id));
  if (filters.page)        params.set('page',         String(filters.page));
  if (filters.limit)       params.set('limit',        String(filters.limit));

  const response = await authFetch(`${TICKETS_BASE}/search?${params.toString()}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error en la búsqueda');
  }

  return response.json();
};

// ─── Detalle de ticket ────────────────────────────────────────────────────────

/**
 * GET /api/tickets/:id
 * Detalle completo de un ticket.
 */
export const getTechnicianTicketById = async (id: string): Promise<Ticket> => {
  const response = await authFetch(`${TICKETS_BASE}/${id}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Ticket no encontrado');
  }

  return response.json();
};

// ─── Actualizar ticket ────────────────────────────────────────────────────────

/**
 * PATCH /api/tickets/:id
 * Actualiza descripción, prioridad o categoría del ticket.
 */
export const updateTicket = async (
  id: string,
  payload: UpdateTicketPayload,
): Promise<Ticket> => {
  const response = await authFetch(`${TICKETS_BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al actualizar el ticket');
  }

  return response.json();
};

// ─── Cambiar estado del ticket ────────────────────────────────────────────────

/**
 * PATCH /api/tickets/:id/status
 * Cambia el estado del ticket. Flujo: abierto → en_progreso → resuelto → cerrado
 */
export const updateTicketStatus = async (
  id: string,
  payload: UpdateTicketStatusPayload,
): Promise<UpdateTicketStatusResponse> => {
  const response = await authFetch(`${TICKETS_BASE}/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al cambiar el estado');
  }

  return response.json();
};

// ─── Comentarios ──────────────────────────────────────────────────────────────

/**
 * GET /api/tickets/:id/comments
 * Lista todos los comentarios (incluyendo internos) del ticket.
 */
export const getTechnicianComments = async (
  ticketId: string,
): Promise<CommentsResponse> => {
  const response = await authFetch(`${TICKETS_BASE}/${ticketId}/comments`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al cargar los comentarios');
  }

  return response.json();
};

/**
 * POST /api/tickets/:id/comments
 * Agrega un comentario. El técnico puede marcar is_internal: true.
 */
export const addTechnicianComment = async (
  ticketId: string,
  payload: TechnicianCreateCommentPayload,
): Promise<Comment> => {
  const response = await authFetch(`${TICKETS_BASE}/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al agregar el comentario');
  }

  return response.json();
};

// ─── Asignación del ticket ────────────────────────────────────────────────────

/**
 * GET /api/assignments/ticket/:ticket_id
 * Obtiene la asignación activa de un ticket.
 */
export const getTicketAssignment = async (
  ticketId: string,
): Promise<TicketAssignmentResponse | null> => {
  const response = await authFetch(`${ASSIGNMENTS_BASE}/ticket/${ticketId}`);

  if (response.status === 404) return null;

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al cargar la asignación');
  }

  return response.json();
};

/**
 * GET /api/assignments/technician/:technician_id
 * Lista las asignaciones de un técnico con filtro opcional por estado.
 */
export const getTechnicianAssignments = async (
  technicianId: string,
  status?: string,
): Promise<TechnicianAssignmentsResponse> => {
  const params = status ? `?status=${status}` : '';
  const response = await authFetch(
    `${ASSIGNMENTS_BASE}/technician/${technicianId}${params}`,
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al cargar las asignaciones');
  }

  return response.json();
};
