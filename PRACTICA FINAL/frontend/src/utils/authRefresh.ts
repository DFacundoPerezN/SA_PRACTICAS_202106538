// authRefresh.ts
import { CONFIG } from "../config/config";
import { getRefreshToken, setSession, logout } from "./authStorage";

// Promesa compartida para evitar refreshes paralelos
let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  // Si ya hay un refresh en vuelo, esperar el mismo
  if (refreshPromise) return refreshPromise;

  refreshPromise = _doRefresh().finally(() => {
    refreshPromise = null; // Limpiar cuando termine
  });

  return refreshPromise;
};

const _doRefresh = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) throw new Error("Refresh token inválido");

    const data = await response.json();

    setSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
    });

    return data.accessToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    await logout();
    return null;
  }
};