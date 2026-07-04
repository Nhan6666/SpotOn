import { http } from '@/lib/http';
import { BookingRules } from './system-settings.types';

const ENDPOINT = '/system-configs';

export const systemSettingsService = {
  getBookingRules: async (): Promise<BookingRules> => {
    const res = await http.get<{ success: boolean; data: BookingRules }>(`${ENDPOINT}/booking-rules`);
    return res.data;
  },

  updateBookingRules: async (rules: BookingRules): Promise<BookingRules> => {
    const res = await http.put<{ success: boolean; data: BookingRules }>(`${ENDPOINT}/booking-rules`, rules);
    return res.data;
  }
};
