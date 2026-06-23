import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  locale: string;
}

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, profile: UserProfile) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      profile: null,
      isAuthenticated: false,
      setAuth: (token, profile) => set({ token, profile, isAuthenticated: true }),
      clearAuth: () => set({ token: null, profile: null, isAuthenticated: false }),
    }),
    {
      name: 'mcq-user-auth',
    }
  )
);
