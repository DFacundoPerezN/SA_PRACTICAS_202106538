import { authFetch } from '../utils/authFetch';
import { CONFIG } from '../config/config';


const BASE = `${CONFIG.API_URL}/api/users`;

export interface UserInfoResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const getUserInfoByEmail = async (email: string): Promise<UserInfoResponse> => {
  const response = await authFetch(`${BASE}/email/${email}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Error al obtener la información del usuario');
  }
  return response.json();
};

export const getUserInfoById = async (id: string): Promise<UserInfoResponse> => {
  const response = await authFetch(`${BASE}/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Error al obtener la información del usuario');
  }
  return response.json();
};