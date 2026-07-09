"use client";

import { useEffect, useState, ReactNode } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const ADMIN_EMAIL = 'admin@spoton.vn';
const ADMIN_PASSWORD = 'Admin@123';
const TOKEN_KEY = 'spoton_token';

/**
 * AdminAuthGuard
 * Tự động đăng nhập với tài khoản Admin khi vào khu vực Admin.
 * Token được lưu vào localStorage để http.ts tự gắn vào mọi request.
 * 
 * TODO: Thay thế bằng Login Page thực tế khi deploy production.
 */
export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function ensureAuth() {
      // Nếu đã có token, verify xem còn hợp lệ không
      const existingToken = localStorage.getItem(TOKEN_KEY);
      if (existingToken) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${existingToken}` },
          });
          if (res.ok) {
            setIsReady(true);
            return;
          }
        } catch {
          // Token hết hạn hoặc lỗi, login lại
        }
      }

      // Auto-login
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
        });

        const data = await res.json();

        if (data.success && data.data?.token) {
          localStorage.setItem(TOKEN_KEY, data.data.token);
          setIsReady(true);
        } else {
          setError(data.message || 'Không thể đăng nhập tự động.');
        }
      } catch (err) {
        setError('Không thể kết nối Backend. Đảm bảo server đang chạy trên port 5000.');
      }
    }

    ensureAuth();
  }, []);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <h3 className="text-red-800 font-bold text-lg mb-2">Lỗi xác thực Admin</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Đang xác thực Admin...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
