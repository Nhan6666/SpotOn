import { LoginFeature } from '@/features/auth/LoginFeature';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập | SpotOn',
  description: 'Đăng nhập vào hệ thống SpotOn',
};

export default function LoginPage() {
  return <LoginFeature />;
}