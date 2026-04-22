import { authFetch } from '../utils/authFetch';
import { CONFIG } from '../config/config';
import type {
  Ticket,
  MyTicketsResponse,
  CreateTicketPayload,
  CommentsResponse,
  CreateCommentPayload,
  TicketsResponsebyId,
} from '../types/ticket.types';

const BASE = `${CONFIG.API_URL}/api/tickets`;

// ─── Mis tickets (cliente) ────────────────────────────────────────────────────

/**
 * GET /api/tickets/my
 * Lista los tickets del cliente autenticado.
 */
export const getMyTickets = async (): Promise<MyTicketsResponse> => {
  const response = await authFetch(`${BASE}/my`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al cargar los tickets');
  }

  const data = await response.json();

  // El backend puede omitir "tickets" cuando no hay resultados
  return {
    tickets: data.tickets ?? [],
    total: data.total ?? 0,
  };
};

// ─── Detalle de ticket ────────────────────────────────────────────────────────

/**
 * GET /api/tickets/:id
 * Detalle completo de un ticket. Accesible por cualquier rol autenticado.
 */
export const getTicketById = async (id: string): Promise<TicketsResponsebyId> => {
  const response = await authFetch(`${BASE}/${id}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Ticket no encontrado');
  }

  return response.json();
};

// ─── Crear ticket ─────────────────────────────────────────────────────────────

/**
 * POST /api/tickets
 * Crea un nuevo ticket. El backend extrae `created_by` del JWT.
 */
export const createTicket = async (payload: CreateTicketPayload): Promise<Ticket> => {
  const response = await authFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al crear el ticket');
  }

  return response.json();
};

// ─── Comentarios ──────────────────────────────────────────────────────────────

/**
 * GET /api/tickets/:id/comments
 * Lista comentarios del ticket. El cliente solo recibe los públicos (is_internal: false).
 */
export const getComments = async (ticketId: string): Promise<CommentsResponse> => {
  const response = await authFetch(`${BASE}/${ticketId}/comments`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al cargar los comentarios');
  }

  const data = await response.json();

  // El backend puede omitir "comments" cuando no hay resultados
  return {
    comments: data.comments ?? [],
    total: data.total ?? 0,
  };
};

/**
 * POST /api/tickets/:id/comments
 * Agrega un comentario público (is_internal: false) al ticket.
 */
export const addComment = async (
  ticketId: string,
  payload: CreateCommentPayload,
): Promise<Comment> => {
  const response = await authFetch(`${BASE}/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al agregar el comentario');
  }

  return response.json();
};
