import { http } from '@/lib/http';
import { Amenity, CreateAmenityDto, UpdateAmenityDto } from './amenities.types';

const ENDPOINT = '/amenities';

export const amenitiesService = {
  getAll: async (): Promise<Amenity[]> => {
    const res = await http.get<{ success: boolean; data: Amenity[] }>(ENDPOINT);
    return res.data;
  },

  create: async (data: CreateAmenityDto): Promise<Amenity> => {
    const res = await http.post<{ success: boolean; data: Amenity }>(ENDPOINT, data);
    return res.data;
  },

  update: async (id: string, data: UpdateAmenityDto): Promise<Amenity> => {
    const res = await http.put<{ success: boolean; data: Amenity }>(`${ENDPOINT}/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await http.delete(`${ENDPOINT}/${id}`);
  }
};
