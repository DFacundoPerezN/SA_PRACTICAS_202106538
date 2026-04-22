import { authFetch } from '../utils/authFetch';
import { CONFIG } from '../config/config';
import type {
  RegisterUserRequest,
  RegisterUserResponse,
  ApiErrorResponse,
  AdminGetTicketsResponse,
  AdminGetTicketsParams,
  GetWorkloadResponse,
  GetAssignmentsResponse,
  GetAssignmentsParams
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
   * Obtiene la carga de trabajo activa de todos los técnicos
   * @returns Promise con la lista de técnicos ordenada por carga de trabajo
   */
  static async getWorkload(): Promise<GetWorkloadResponse> {
    try {
      const url = `${CONFIG.API_URL}/api/assignments/workload`;
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

      const result: GetWorkloadResponse = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener la carga de trabajo');
    }
  }

  static async getTickets(params: AdminGetTicketsParams = {}): Promise<AdminGetTicketsResponse> {
    const url = `${CONFIG.API_URL}/api/tickets?${new URLSearchParams(params as Record<string, string>).toString()}`;
    const response = await authFetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result: AdminGetTicketsResponse = await response.json();
    return result;

  } catch(error: any) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Error al obtener los tickets');
    }
  }

  /**
   * Obtiene la lista de asignaciones con filtros y paginación
   * @param params - Parámetros de consulta (status, technician_id, ticket_id, from, to, page, limit)
   * @returns Promise con la lista de asignaciones y total
   */
  static async getAssignments(params: GetAssignmentsParams = {}): Promise<GetAssignmentsResponse> {
    try {
      // Construir query params eliminando undefined y valores vacíos
      const queryParams = new URLSearchParams();

      if (params.status) queryParams.append('status', params.status);
      if (params.technician_id) queryParams.append('technician_id', params.technician_id);
      if (params.ticket_id) queryParams.append('ticket_id', params.ticket_id);
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const url = `${CONFIG.API_URL}/api/assignments?${queryParams.toString()}`;
      const response = await authFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.message) {
          if (Array.isArray(errorData.message)) {
            throw new Error(errorData.message.join(', '));
          }
          throw new Error(errorData.message);
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result: GetAssignmentsResponse = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener las asignaciones');
    }
  }

  /**
   * Obtiene la lista de tickets para filtros (sin paginación completa)
   * @param params - Parámetros de consulta
   * @returns Promise con la lista de tickets
   */
  static async getTicketsForFilter(params: { status?: string; limit?: number } = {}): Promise<AdminGetTicketsResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', '1');
      queryParams.append('limit', params.limit?.toString() || '100');
      if (params.status) queryParams.append('status', params.status);

      const url = `${CONFIG.API_URL}/api/tickets?${queryParams.toString()}`;
      const response = await authFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result: AdminGetTicketsResponse = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener los tickets');
    }
  }
}