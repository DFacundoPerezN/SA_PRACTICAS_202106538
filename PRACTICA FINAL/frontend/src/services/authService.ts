import { CONFIG } from '../config/config';

const BASE = `${CONFIG.API_URL}/api/auth`;

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
  userId: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
  message: string;
}

// ── Peticiones ─────────────────────────────────────────────────────────────

export const loginRequest = async (payload: LoginPayload): Promise<LoginResponse> => {


  const response = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Credenciales incorrectas');
  }

  return data as LoginResponse;
};

export const registerRequest = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const response = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error en el registro');
  }

  return data as RegisterResponse;
};
