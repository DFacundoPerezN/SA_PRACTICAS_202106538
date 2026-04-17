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

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cliente' | 'tecnico' | 'administrador';
  isActive: boolean;
  createdAt: string;
}

export interface GetUsersResponse {
  users: User[];
  total: number;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: 'cliente' | 'tecnico' | 'administrador';
}

export interface UpdateUserRequest {
  name?: string;
  role?: 'cliente' | 'tecnico' | 'administrador';
}

export interface UpdateUserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}