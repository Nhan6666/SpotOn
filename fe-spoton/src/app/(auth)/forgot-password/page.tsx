import { ForgotPasswordFeature } from '@/features/auth/ForgotPasswordFeature';

export const metadata = {
  title: 'Quên mật khẩu - SpotOn',
  description: 'Khôi phục mật khẩu tài khoản SpotOn của bạn.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordFeature />;
}
