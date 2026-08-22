import { create } from 'zustand';
import { api, tokenStorage } from '../services/api';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isHydrated: false,

  async login(email, password) {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await tokenStorage.setTokens(data.data.access_token, data.data.refresh_token);
      set({ user: data.data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // best-effort; clear local session regardless
    }
    await tokenStorage.clear();
    set({ user: null });
  },

  async hydrate() {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) return set({ isHydrated: true });
      const { data } = await api.get('/auth/me');
      set({ user: data.data, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
