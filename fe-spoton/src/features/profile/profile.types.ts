export interface UserProfile {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  has_custom_avatar: boolean;
  role: string;
  // Để frontend biết user có mật khẩu chưa
  password_hash?: string | null; 
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordPayload {
  oldPassword?: string;
  newPassword: string;
}

export interface UploadAvatarResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
  };
}
