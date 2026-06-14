"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

// Khai báo các types
export type Role = "GUEST" | "CUSTOMER" | "WAITER" | "MANAGER" | "ADMIN";

export interface User {
  _id: string;
  email: string;
  full_name: string;
  role: Role;
  avatar?: string;
  branch_id?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Hàm tự động chạy khi F5/Mở web để check token
    const checkAuth = async () => {
      try {
        // Tìm token ở localStorage, sessionStorage hoặc Cookie
        let token = localStorage.getItem("spoton_token") || sessionStorage.getItem("spoton_token");

        if (!token) {
          // Lấy từ cookie dự phòng (hỗ trợ cho cả Next.js Middleware)
          const match = document.cookie.match(new RegExp('(^| )spoton_token=([^;]+)'));
          if (match) token = match[2];
        }

        if (!token) {
          setIsLoading(false);
          return;
        }

        // Gọi API getMe từ Backend
        const res = await fetch("http://localhost:5000/api/v1/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          setUser(data.data);
        } else {
          // Token hết hạn hoặc không hợp lệ -> Xóa đi
          localStorage.removeItem("spoton_token");
        }
      } catch (error) {
        console.error("Lỗi xác thực:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    // Lưu token vào localStorage (Và cookie nếu sau này làm Middleware)
    localStorage.setItem("spoton_token", token);
    
    // Tạo cookie thủ công để Next.js Middleware đọc được
    document.cookie = `spoton_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    document.cookie = `spoton_role=${userData.role}; path=/; max-age=${7 * 24 * 60 * 60}`;

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("spoton_token");
    document.cookie = "spoton_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    document.cookie = "spoton_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    setUser(null);
    router.push("/login"); // Đá về trang login
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {/* Trong lúc call API check token thì hiện Loading mờ mờ tránh giật giao diện */}
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-[#FF5A5F] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

// Hook tiện ích để lấy data ở các component khác
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return context;
}