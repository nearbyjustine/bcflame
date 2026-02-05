import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { strapiApi } from '@/lib/api/strapi';
import { getUserProfile, uploadUserLogo, type UserProfile } from '@/lib/api/user';

interface User {
  id: number;
  username: string;
  email: string;
  companyName?: string;
  partnerStatus?: 'pending' | 'active' | 'suspended';
  partnerTier?: 'standard' | 'premium' | 'elite';
  userType?: 'reseller' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userProfile: UserProfile | null;

  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  uploadLogo: (file: File) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      userProfile: null,

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

          // Fetch user profile after login
          await get().fetchUserProfile();
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
          userProfile: null,
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

          // Fetch user profile after auth check
          await get().fetchUserProfile();
        } catch (error) {
          Cookies.remove('jwt');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            userProfile: null,
          });
        }
      },

      fetchUserProfile: async () => {
        try {
          const profile = await getUserProfile();
          set({ userProfile: profile });
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      },

      setUserProfile: (profile) => {
        set({ userProfile: profile });
      },

      uploadLogo: async (file: File) => {
        try {
          const updatedProfile = await uploadUserLogo(file);
          set({ userProfile: updatedProfile });
        } catch (error) {
          console.error('Logo upload failed:', error);
          throw error;
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
