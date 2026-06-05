import { Metadata } from 'next';
import { RegisterFeature } from '@/features/auth/RegisterFeature';

export const metadata: Metadata = {
  title: 'Đăng ký tài khoản | SpotOn',
  description: 'Tạo tài khoản mới để tham gia nền tảng quản lý nhà hàng SpotOn.',
};

export default function RegisterPage() {
  return <RegisterFeature />;
}