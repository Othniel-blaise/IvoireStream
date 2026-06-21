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

  initialize:  () => Promise<void>;
  login:       (emailOrPhone: string, password: string) => Promise<void>;
  register:    (data: RegisterData) => Promise<void>;
  logout:      () => Promise<void>;
  updateUser:  (partial: Partial<User>) => void;
  clearError:  () => void;
}

interface RegisterData {
  username:    string;
  handle:      string;
  email:       string;
  password:    string;
  phone?:      string;
  avatarEmoji: string;
}

// Singleton : une seule promesse initialize() en vol — empêche la race condition
// sur la rotation des refresh tokens (plusieurs 401 simultanés → double consume)
let _initPromise: Promise<void> | null = null;

// Fetch avec timeout de 90s (Render free tier peut mettre 60s à démarrer)
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 90_000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function apiPost(path: string, body: object, token?: string) {
  const res = await fetchWithTimeout(`${API_URL}${path}`, {
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
  const res = await fetchWithTimeout(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

function saveSession(set: (s: Partial<AuthStore>) => void) {
  return async (user: User, accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, accessToken, isAuthenticated: true, isLoading: false, error: null });
  };
}

export const useAuthStore = create<AuthStore>((set) => {
  const persistSession = saveSession(set as (s: Partial<AuthStore>) => void);

  return {
    user:            null,
    accessToken:     null,
    isAuthenticated: false,
    isLoading:       false,
    error:           null,

    // ── Restaure la session au démarrage ─────────────────────────────────
    initialize: async () => {
      // Renvoie la promesse en cours si un refresh est déjà en vol —
      // évite la race condition : deux 401 simultanés qui consommeraient
      // le même refresh token et supprimeraient le suivant du SecureStore.
      if (_initPromise) return _initPromise;

      _initPromise = (async () => {
        set({ isLoading: true });
        try {
          const refreshToken = await SecureStore.getItemAsync('refreshToken');
          if (!refreshToken) return;

          const json = await apiPost('/api/auth/refresh', { refreshToken });
          if (!json.success) {
            await SecureStore.deleteItemAsync('refreshToken');
            return;
          }

          const { accessToken, refreshToken: newRefresh } = json.data;
          await SecureStore.setItemAsync('refreshToken', newRefresh);
          set({ accessToken });

          const me = await apiGet('/api/auth/me', accessToken);
          if (me.success) {
            set({ user: me.data.user, isAuthenticated: true });
          }
        } catch {
          // Serveur en veille ou réseau coupé — token conservé pour la prochaine ouverture
        } finally {
          set({ isLoading: false });
          _initPromise = null;
        }
      })();

      return _initPromise;
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
        await persistSession(json.data.user, json.data.accessToken, json.data.refreshToken);
      } catch (e: unknown) {
        const isTimeout = e instanceof Error && e.name === 'AbortError';
        set({
          error: isTimeout
            ? 'Le serveur démarre, réessaie dans 30 secondes...'
            : 'Impossible de se connecter. Vérifie ta connexion réseau.',
          isLoading: false,
        });
      }
    },

    // ── Register ──────────────────────────────────────────────────────────
    register: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const json = await apiPost('/api/auth/register', {
          ...data,
          handle: data.handle.startsWith('@') ? data.handle : `@${data.handle}`,
        });
        if (!json.success) {
          set({ error: json.error ?? 'Inscription échouée', isLoading: false });
          return;
        }
        await persistSession(json.data.user, json.data.accessToken, json.data.refreshToken);
      } catch (e: unknown) {
        const isTimeout = e instanceof Error && e.name === 'AbortError';
        set({
          error: isTimeout
            ? 'Le serveur démarre, réessaie dans 30 secondes...'
            : 'Impossible de se connecter. Vérifie ta connexion réseau.',
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

    updateUser: (partial) => set(s => ({ user: s.user ? { ...s.user, ...partial } : null })),
    clearError: () => set({ error: null }),
  };
});
