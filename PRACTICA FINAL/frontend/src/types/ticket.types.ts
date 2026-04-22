// ─── Catálogos ────────────────────────────────────────────────────────────────

export type TicketStatus =
  | 'abierto'
  | 'en_progreso'
  | 'resuelto'
  | 'cerrado'
  | 'reabierto';

export type TicketPriority = 'baja' | 'media' | 'alta' | 'critica';

// category_id: 1=Hardware 2=Software 3=Red/Conectividad
//              4=Accesos y Permisos 5=Correo Electrónico 6=Otro
export type CategoryId = 1 | 2 | 3 | 4 | 5 | 6;

// priority_id: 1=baja 2=media 3=alta 4=critica
export type PriorityId = 1 | 2 | 3 | 4;

// ─── Ticket ───────────────────────────────────────────────────────────────────

/** Ticket completo devuelto por GET /api/tickets/:id  */
export interface Ticket {
  ticket:{}
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketsResponsebyId {
  ticket: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    createdBy: string;
    assignedTo: string | null;
    createdAt: string;
    updatedAt: string;
  }
};


/** Item de la lista devuelta por GET /api/tickets/my  */
export interface TicketListItem {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdAt: string;
}

/** Respuesta paginada de GET /api/tickets/my  */
export interface MyTicketsResponse {
  tickets: TicketListItem[];
  total: number;
}

// ─── Crear ticket ─────────────────────────────────────────────────────────────

/** Body de POST /api/tickets  */
export interface CreateTicketPayload {
  title: string;
  description: string;
  category_id: CategoryId;
  priority_id: PriorityId;
}

// ─── Comentarios ──────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  ticketId?: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

/** Respuesta de GET /api/tickets/:id/comments  */
export interface CommentsResponse {
  comments: Comment[];
  total: number;
}

/** Body de POST /api/tickets/:id/comments  */
export interface CreateCommentPayload {
  content: string;
  is_internal: false; // el cliente siempre envía false
}
