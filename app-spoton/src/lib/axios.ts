import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.10.100.205:5000/api/v1';

console.log('🔗 API Base URL:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    console.log('📡 Request:', config.method?.toUpperCase(), (config.baseURL || '') + (config.url || ''));
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('❌ Error:', error.message, error.config?.url);
    return Promise.reject(error);
  }
);

export default apiClient;
