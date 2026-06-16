import { create } from 'zustand';
import { apiGet, apiPost } from '../lib/api';

export interface ApiStream {
  id:           string;
  hostId:       string;
  title:        string;
  emoji:        string;
  description?: string;
  viewerCount:  number;
  isLive:       boolean;
  visibility:   'PUBLIC' | 'PRIVATE';
  priceXOF?:    number;
  category:     string;
  startedAt:    string;
  endedAt?:     string;
  host: {
    id:             string;
    username:       string;
    handle:         string;
    avatarEmoji:    string;
    isVerified:     boolean;
    followersCount: number;
  };
}

export interface HostSession {
  stream:      ApiStream;
  channelName: string;
  agoraToken:  string;
  appId:       string;
}

export interface CreateLiveData {
  title:        string;
  emoji:        string;
  category:     string;
  visibility:   'PUBLIC' | 'PRIVATE';
  priceXOF?:    number;
  description?: string;
}

interface StreamStore {
  streams:     ApiStream[];
  hostSession: HostSession | null;
  isLoading:   boolean;
  error:       string | null;

  fetchStreams:  () => Promise<void>;
  startLive:    (data: CreateLiveData) => Promise<HostSession | null>;
  endLive:      (streamId: string) => Promise<void>;
  clearSession: () => void;
  clearError:   () => void;
}

export const useStreamStore = create<StreamStore>((set) => ({
  streams:     [],
  hostSession: null,
  isLoading:   false,
  error:       null,

  fetchStreams: async () => {
    set({ isLoading: true });
    const res = await apiGet<{ streams: ApiStream[] }>('/api/streams');
    if (res.success && res.data) set({ streams: res.data.streams });
    set({ isLoading: false });
  },

  startLive: async (data) => {
    set({ isLoading: true, error: null });
    const res = await apiPost<{
      stream:      ApiStream;
      channelName: string;
      agoraToken:  string;
      appId:       string;
    }>('/api/streams', { ...data, category: data.category.toUpperCase() });

    if (!res.success || !res.data) {
      set({ error: res.error ?? 'Impossible de lancer le live', isLoading: false });
      return null;
    }

    const session: HostSession = {
      stream:      res.data.stream,
      channelName: res.data.channelName,
      agoraToken:  res.data.agoraToken,
      appId:       res.data.appId,
    };
    set({ hostSession: session, isLoading: false });
    return session;
  },

  endLive: async (streamId) => {
    await apiPost(`/api/streams/${streamId}/end`);
    set({ hostSession: null });
  },

  clearSession: () => set({ hostSession: null }),
  clearError:   () => set({ error: null }),
}));
