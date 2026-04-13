import { CONFIG } from '../config/config';

const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";
const USER_INFO = "user";

export const setSession = ({
  accessToken,
  refreshToken,
}: {
  accessToken: string;
  refreshToken: string;
}) => {
  localStorage.setItem(ACCESS_TOKEN, accessToken);
  localStorage.setItem(REFRESH_TOKEN, refreshToken);

  const payload = JSON.parse(atob(accessToken.split(".")[1]));
  localStorage.setItem(USER_INFO, JSON.stringify(payload));
};

export const getAccessToken = () =>
  localStorage.getItem(ACCESS_TOKEN);

export const getRefreshToken = () =>
  localStorage.getItem(REFRESH_TOKEN);

export const getUser = () => {
  const user = localStorage.getItem(USER_INFO);
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};

export const isTokenExpired = (): boolean => {
  const token = getAccessToken();
  if (!token) return true;
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    // Margen de 30s para evitar expiración justo durante el fetch
    return Date.now() / 1000 >= exp - 30;
  } catch {
    return true;
  }
};

// Función de logout actualizada para llamar al backend
export const logout = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  
  try {
    if (refreshToken) {
      // Hacer la petición de logout al backend
      const response = await fetch(`${CONFIG.API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refreshToken
        }),
      });

      // No importa si la respuesta falla, igual se limpia el frontend
      console.log('Logout API response:', response.status);
    }
  } catch (error) {
    console.error('Error calling logout API:', error);
    // Se continua aunque falle la API
  } finally {
    // se limpia el localStorage
    localStorage.clear();
  }
  
  return true;
};
