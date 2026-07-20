import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const getDefaultUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:5000/api/v1';
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api/v1';
  return 'http://localhost:5000/api/v1';
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultUrl();

import { parseApiError } from './errors';

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
    return Promise.reject(parseApiError(error));
  }
);

export default apiClient;
