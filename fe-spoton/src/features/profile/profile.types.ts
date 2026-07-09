export interface UserProfile {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  has_custom_avatar: boolean;
  role: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  avatar?: string;
}


export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
  };
}
