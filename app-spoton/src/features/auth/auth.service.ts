import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import apiClient from '@/lib/http';

export const AuthService = {
  async login(email: string, password: string) {
    // Standard backend login fallback or primary logic
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async loginWithFirebase(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    const response = await apiClient.post('/auth/login', { idToken: token });
    return response.data;
  },

  async register(data: any) {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async verifyOtp(email: string, otp: string) {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  /** Google OAuth — sends Firebase idToken to backend */
  async loginWithGoogle(idToken: string) {
    const response = await apiClient.post('/auth/google', { idToken });
    return response.data;
  },
};
