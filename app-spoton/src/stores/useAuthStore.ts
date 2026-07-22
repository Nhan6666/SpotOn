import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user.types';
import apiClient from '../lib/http';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasChecked: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasChecked: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // No token = Guest mode — allow browsing
        set({ user: null, isAuthenticated: false, isLoading: false, hasChecked: true });
        return;
      }
      
      const response = await apiClient.get('/auth/me');
      if (response.data.success) {
        set({ user: response.data.data, isAuthenticated: true, isLoading: false, hasChecked: true });
      } else {
        await AsyncStorage.removeItem('token');
        set({ user: null, isAuthenticated: false, isLoading: false, hasChecked: true });
      }
    } catch (error) {
      await AsyncStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, isLoading: false, hasChecked: true });
    }
  },
  logout: async () => {
    await AsyncStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },
}));
