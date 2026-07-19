export type Role = 'ADMIN' | 'MANAGER' | 'WAITER' | 'CUSTOMER' | 'KITCHEN';

export interface User {
  _id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: Role;
  is_email_verified: boolean;
  profile_allergies?: string;
  profile_vip_notes?: string;
  branch_id?: string;
}
