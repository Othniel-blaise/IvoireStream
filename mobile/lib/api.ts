import { useAuthStore } from '../store/auth.store';
import { API_URL } from '../constants/api';

type ApiResponse<T = unknown> = { success: boolean; data?: T; error?: string };

function getHeaders(token?: string | null): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(
  path: string,
  options: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const token = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...getHeaders(token), ...options.headers },
    });

    // Token expiré → on rafraîchit et on réessaie une fois
    if (res.status === 401) {
      await useAuthStore.getState().initialize();
      const newToken = useAuthStore.getState().accessToken;
      if (newToken) {
        const retry = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: { ...getHeaders(newToken), ...options.headers },
        });
        return retry.json();
      }
      return { success: false, error: 'Session expirée' };
    }

    return res.json();
  } catch {
    return { success: false, error: 'Erreur réseau' };
  }
}

export const apiGet    = <T>(path: string) =>
  request<T>(path, { method: 'GET' });

export const apiPost   = <T>(path: string, body?: object) =>
  request<T>(path, { method: 'POST',  body: body ? JSON.stringify(body) : undefined });

export const apiPatch  = <T>(path: string, body?: object) =>
  request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });

export const apiDelete = <T>(path: string) =>
  request<T>(path, { method: 'DELETE' });
