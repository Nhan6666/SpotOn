export interface Amenity {
  _id: string;
  name: string;
  icon: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAmenityDto {
  name: string;
  icon: string;
  description?: string;
}

export interface UpdateAmenityDto {
  name?: string;
  icon?: string;
  description?: string;
  is_active?: boolean;
}
