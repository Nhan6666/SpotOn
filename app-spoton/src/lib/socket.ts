import { io, Socket } from 'socket.io-client';

import { Platform } from 'react-native';

const getDefaultSocketUrl = () => {
  if (Platform.OS === 'web') return 'http://localhost:5000';
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'http://localhost:5000';
};

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || getDefaultSocketUrl();

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};
