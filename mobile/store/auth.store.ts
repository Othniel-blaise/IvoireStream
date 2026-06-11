import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';
import type { User } from '../types';

interface AuthStore {
  user:            User | null;
  accessToken:     string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  error:           string | null;

  initialize: () => Promise<void>;
  login:      (emailOrPhone: string, password: string) => Promise<void>;
  logout:     () => Promise<void>;
  clearError: () => void;
}

async function apiPost(path: string, body: object, token?: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiGet(path: string, token: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export const useAuthStore = create<AuthStore>((set) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null,

  // ── Vérifie le token stocké au démarrage ─────────────────────────────
  initialize: async () => {
    set({ isLoading: true });
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) { set({ isLoading: false }); return; }

      const json = await apiPost('/api/auth/refresh', { refreshToken });
      if (!json.success) {
        await SecureStore.deleteItemAsync('refreshToken');
        set({ isLoading: false });
        return;
      }

      const { accessToken, refreshToken: newRefresh } = json.data;
      await SecureStore.setItemAsync('refreshToken', newRefresh);

      const me = await apiGet('/api/auth/me', accessToken);
      if (me.success) {
        set({ user: me.data.user, accessToken, isAuthenticated: true });
      }
    } catch {
      // Réseau indisponible — on laisse l'utilisateur se reconnecter
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Login ─────────────────────────────────────────────────────────────
  login: async (emailOrPhone, password) => {
    set({ isLoading: true, error: null });
    try {
      const json = await apiPost('/api/auth/login', { emailOrPhone, password });
      if (!json.success) {
        set({ error: json.error ?? 'Identifiants incorrects', isLoading: false });
        return;
      }
      const { user, accessToken, refreshToken } = json.data;
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      set({ user, accessToken, isAuthenticated: true, isLoading: false, error: null });
    } catch {
      set({
        error: 'Impossible de se connecter. Vérifie ta connexion réseau.',
        isLoading: false,
      });
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        await apiPost('/api/auth/logout', { refreshToken });
        await SecureStore.deleteItemAsync('refreshToken');
      }
    } catch { /* ignore */ } finally {
      set({ user: null, accessToken: null, isAuthenticated: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
