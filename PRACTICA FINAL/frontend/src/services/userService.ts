import { authFetch } from '../utils/authFetch';
import { CONFIG } from '../config/config';
import type { DeleteUserResponse, GetUsersParams, GetUsersResponse, UpdateUserRequest, UpdateUserResponse, UserInfoResponse } from '../types/users.type';

const BASE = `${CONFIG.API_URL}/api/users`;

export class UserService {

  static async getUserInfoByEmail(email: string): Promise<UserInfoResponse> {
    const response = await authFetch(`${BASE}/email/${email}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Error al obtener la información del usuario');
    }
    return response.json();
  };

  static async getUserInfoById(id: string): Promise<UserInfoResponse> {
    const response = await authFetch(`${BASE}/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Error al obtener la información del usuario');
    }
    return response.json();
  };


  /**
    * Obtiene lista de usuarios con filtros y paginación
    * @param params - Parámetros de consulta (page, limit, role)
    * @returns Promise con la lista de usuarios y total
    */
  static async getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
    try {
      const { page = 1, limit = 20, role } = params;
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (role) queryParams.append('role', role);

      const url = `${CONFIG.API_URL}/api/users?${queryParams.toString()}`;
      const response = await authFetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (Array.isArray(errorData.message)) {
          throw new Error(errorData.message.join(', '));
        }
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result: GetUsersResponse = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener los usuarios');
    }
  }

  /**
   * Actualiza un usuario existente
   * @param userId - ID del usuario a actualizar
   * @param data - Datos a actualizar (name y/o role)
   * @returns Promise con el usuario actualizado
   */
  static async updateUser(userId: string, data: UpdateUserRequest): Promise<UpdateUserResponse> {
    try {
      const url = `${CONFIG.API_URL}/api/users/${userId}`;
      const response = await authFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (Array.isArray(errorData.message)) {
          throw new Error(errorData.message.join(', '));
        }
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result: UpdateUserResponse = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al actualizar el usuario');
    }
  }

  /**
   * Elimina un usuario (soft delete o hard delete según backend)
   * @param userId - ID del usuario a eliminar
   * @returns Promise con la respuesta de eliminación
   */
  static async deleteUser(userId: string): Promise<DeleteUserResponse> {
    try {
      const url = `${CONFIG.API_URL}/api/users/${userId}`;
      const response = await authFetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (Array.isArray(errorData.message)) {
          throw new Error(errorData.message.join(', '));
        }
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result: DeleteUserResponse = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al eliminar el usuario');
    }
  }
}