import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { strapiApi } from '@/lib/api/strapi';

interface User {
  id: number;
  username: string;
  email: string;
  companyName?: string;
  partnerStatus?: 'pending' | 'active' | 'suspended';
  partnerTier?: 'standard' | 'premium' | 'elite';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (identifier, password) => {
        try {
          const response = await strapiApi.post('/api/auth/local', {
            identifier,
            password,
          });

          const { jwt, user } = response.data;
          Cookies.set('jwt', jwt, { expires: 7 });

          set({
            user,
            token: jwt,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        Cookies.remove('jwt');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = Cookies.get('jwt');
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await strapiApi.get('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            user: response.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          Cookies.remove('jwt');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
