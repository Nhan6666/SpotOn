import { http } from '@/lib/http';
import { 
  UserProfile, 
  UpdateProfilePayload, 
  UploadAvatarResponse 
} from './profile.types';

export const profileService = {
  getProfile: async () => {
    const res = await http.get<{ success: boolean; data: UserProfile }>('/users/profile');
    return res.data;
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const res = await http.put<{ success: boolean; message: string; data: UserProfile }>('/users/profile', payload);
    return res.data;
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('spoton_token');
    
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    
    const response = await fetch(`${BASE_URL}/uploads/avatar`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Chú ý: KHÔNG set Content-Type, trình duyệt sẽ tự động tạo boundary cho FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Lỗi khi tải ảnh lên');
    }

    const data: UploadAvatarResponse = await response.json();
    return data.data.url;
  },

  getMyBookings: async () => {
    const res = await http.get<{ success: boolean; data: any[] }>('/bookings/my-bookings');
    return res.data;
  },

  cancelBooking: async (bookingId: string, payload?: { bank_name?: string; bank_account_number?: string; account_holder_name?: string; reason?: string; otp?: string }) => {
    const res = await http.post<{ success: boolean; message: string; data: any }>(`/bookings/${bookingId}/cancel-refund`, payload || {});
    return res;
  },

  requestCancelOtp: async (bookingId: string) => {
    const res = await http.post<{ success: boolean; message: string }>(`/bookings/${bookingId}/request-cancel-otp`);
    return res;
  }
};
