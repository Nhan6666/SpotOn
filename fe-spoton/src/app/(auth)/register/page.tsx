import { RegisterFeature } from "@/features/auth/RegisterFeature";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng ký - SpotOn",
  description: "Tạo tài khoản mới trên hệ thống SpotOn",
};

export default function RegisterPage() {
  return <RegisterFeature />;
}
