export const UserRole = {
  CLIENTE: 1,
  TECNICO: 2,
  ADMINISTRADOR: 3,
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.CLIENTE]: 'Cliente',
  [UserRole.TECNICO]: 'Técnico',
  [UserRole.ADMINISTRADOR]: 'Administrador'
};

export interface RegisterUserRequest {
  email: string;
  password: string;
  rol: UserRole;
}

export interface RegisterUserResponse {
  user_id: string;
  role: string;
  message: string;
}

export interface RegisterUserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  rol: UserRole;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface WorkloadItem {
  technicianId: string;
  activeTickets: number;
  lastUpdated: string;
}

export interface GetWorkloadResponse {
  workload: WorkloadItem[];
}

export interface AdminTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'baja' | 'media' | 'alta' | 'critica';
  status: string;
  createdBy: string;
  assignedTo: string | null;
  resolvedAt: string;
  closedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminGetTicketsResponse {
  tickets: AdminTicket[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminGetTicketsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface Assignment {
  id: string;
  ticketId: string;
  technicianId: string;
  assignedBy: string | null;
  status: 'pendiente' | 'asignado' | 'reasignado' | 'cerrado';
  notes: string;
  assignedAt: string;
  closedAt: string;
}

export interface GetAssignmentsResponse {
  assignments: Assignment[];
  total: number;
}

export interface GetAssignmentsParams {
  status?: 'pendiente' | 'asignado' | 'reasignado' | 'cerrado';
  technician_id?: string;
  ticket_id?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

// Interfaz para asignación enriquecida con emails
export interface EnhancedAssignment extends Assignment {
  technicianEmail?: string;
  technicianName?: string;
  assignedByEmail?: string;
  assignedByName?: string;
  ticketTitle?: string;
}