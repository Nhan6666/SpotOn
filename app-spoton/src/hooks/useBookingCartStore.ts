import { create } from 'zustand';

interface BookingCartState {
  preselectedItems: { item_id: string; quantity: number }[];
  addPreselectedItem: (item_id: string, quantity: number) => void;
  clearPreselectedItems: () => void;
}

export const useBookingCartStore = create<BookingCartState>((set) => ({
  preselectedItems: [],
  addPreselectedItem: (item_id, quantity) => set((state) => {
    const existing = state.preselectedItems.find(i => i.item_id === item_id);
    if (existing) {
      return {
        preselectedItems: state.preselectedItems.map(i => 
          i.item_id === item_id ? { ...i, quantity: i.quantity + quantity } : i
        )
      };
    }
    return { preselectedItems: [...state.preselectedItems, { item_id, quantity }] };
  }),
  clearPreselectedItems: () => set({ preselectedItems: [] }),
}));
