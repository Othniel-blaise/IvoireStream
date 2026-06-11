import { useAuthStore } from '../store/auth.store';
import { API_URL } from '../constants/api';

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().accessToken;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.json();
  } catch {
    return { success: false, error: 'Erreur réseau' };
  }
}

export async function apiPost<T>(path: string, body?: object): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().accessToken;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  } catch {
    return { success: false, error: 'Erreur réseau' };
  }
}

export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().accessToken;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.json();
  } catch {
    return { success: false, error: 'Erreur réseau' };
  }
}
