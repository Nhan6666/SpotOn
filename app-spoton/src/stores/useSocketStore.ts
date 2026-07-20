import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import * as Haptics from 'expo-haptics';

interface SocketState {
  isConnected: boolean;
  lastTableUpdate: Date | null;
  lastBookingUpdate: Date | null;
  lastKitchenOrder: Date | null;
  lastItemReady: Date | null;
  connect: () => void;
  disconnect: () => void;
  joinBranch: (branchId: string) => void;
  setupListeners: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  lastTableUpdate: null,
  lastBookingUpdate: null,
  lastKitchenOrder: null,
  lastItemReady: null,
  
  connect: () => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }
    
    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false }));
  },
  
  disconnect: () => {
    const socket = getSocket();
    if (socket.connected) {
      socket.disconnect();
    }
    set({ isConnected: false });
  },

  joinBranch: (branchId: string) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('join_branch_room', branchId);
    } else {
      socket.once('connect', () => {
        socket.emit('join_branch_room', branchId);
      });
    }
  },

  setupListeners: () => {
    const socket = getSocket();
    
    // Remove existing to avoid duplicates
    socket.off('table_status_changed');
    socket.off('BOOKING_STATUS_CHANGED');
    socket.off('NEW_KITCHEN_ORDER');
    socket.off('ITEM_READY');

    socket.on('table_status_changed', (data) => {
      console.log('socket: table_status_changed', data);
      set({ lastTableUpdate: new Date() });
    });

    socket.on('BOOKING_STATUS_CHANGED', (data) => {
      console.log('socket: BOOKING_STATUS_CHANGED', data);
      set({ lastBookingUpdate: new Date() });
    });

    socket.on('NEW_KITCHEN_ORDER', (data) => {
      console.log('socket: NEW_KITCHEN_ORDER', data);
      set({ lastKitchenOrder: new Date() });
    });

    socket.on('ITEM_READY', (data) => {
      console.log('socket: ITEM_READY', data);
      set({ lastItemReady: new Date() });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    });
  }
}));
