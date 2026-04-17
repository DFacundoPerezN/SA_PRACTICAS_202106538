export interface UserInfoResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
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