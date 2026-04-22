// authFetch.ts — versión optimizada
import { getAccessToken, isTokenExpired } from "./authStorage";
import { refreshAccessToken } from "./authRefresh";

export const authFetch = async (
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> => {
  let token = getAccessToken() || undefined;

  // ✅ Refresh PROACTIVO: si el token ya expiró, refrescamos ANTES de hacer el fetch
  if (isTokenExpired()) {
    const newToken = await refreshAccessToken();
    if (!newToken) throw new Error("Sesión expirada");
    token = newToken;
  }

  const doFetch = async (t?: string) =>
    fetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: t ? `Bearer ${t}` : "",
        "Content-Type": "application/json",
      },
    });

  let response = await doFetch(token);

  // Fallback reactivo: por si el token es inválido por otra razón (revocado, etc.)
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) throw new Error("Sesión expirada");
    response = await doFetch(newToken);
  }

  return response;
};