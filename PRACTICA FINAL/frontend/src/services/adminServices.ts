// src/types/admin.service.ts

import { authFetch } from '../utils/authFetch';
import { CONFIG } from '../config/config';
import type { RegisterUserRequest, RegisterUserResponse, ApiErrorResponse } from '../types/admin.types';
import type {
  GetUsersResponse,
  GetUsersParams,
  UpdateUserRequest,
  UpdateUserResponse,
  DeleteUserResponse
} from '../types/admin.types';

export class AdminService {
  private static readonly API_URL = `${CONFIG.API_URL}/api/auth/admin/register`;

  /**
   * Registra un nuevo usuario desde el panel de administración
   * @param data - Datos del usuario a registrar
   * @returns Promise con la respuesta del servidor
   * @throws Error con mensaje descriptivo del error
   */
  static async registerUser(data: RegisterUserRequest): Promise<RegisterUserResponse> {
    try {
      const response = await authFetch(this.API_URL, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Si la respuesta no es exitosa, procesar el error
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();

        // Manejar diferentes formatos de error
        if (Array.isArray(errorData.message)) {
          throw new Error(errorData.message.join(', '));
        }

        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result: RegisterUserResponse = await response.json();
      return result;
    } catch (error) {
      // Si ya es un Error, lo relanzamos
      if (error instanceof Error) {
        throw error;
      }
      // Si no, creamos un nuevo error
      throw new Error('Error de conexión con el servidor');
    }
  }

  /**
   * Valida los datos del formulario antes de enviar
   * @param email - Correo electrónico
   * @param password - Contraseña
   * @param confirmPassword - Confirmación de contraseña
   * @returns Objeto con errores de validación
   */
  static validateForm(email: string, password: string, confirmPassword: string): Record<string, string> {
    const errors: Record<string, string> = {};

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Ingrese un correo electrónico válido';
    }

    // Validación de contraseña
    if (!password) {
      errors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validación de confirmación de contraseña
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    return errors;
  }

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