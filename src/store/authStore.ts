
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

// Note: This store is now mainly for compatibility with existing components
// The actual authentication state is managed by Clerk
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
      updateProfile: (updates) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
