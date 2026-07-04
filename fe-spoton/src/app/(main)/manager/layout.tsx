"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Store, UtensilsCrossed, BarChart3, CalendarDays, LogOut } from 'lucide-react';

const MANAGER_NAV = [
  { href: '/manager/branch', label: 'Chi nhánh', icon: Store },
  { href: '/manager/menus', label: 'Thực đơn', icon: UtensilsCrossed },
  { href: '/manager/bookings', label: 'Đặt bàn', icon: CalendarDays },
  { href: '/manager/stats', label: 'Thống kê', icon: BarChart3 },
];

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-1 w-full overflow-hidden bg-gray-50 h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0 h-full">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#ea580c] flex items-center justify-center text-white font-bold">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">SpotOn</h1>
            <p className="text-xs text-[#ea580c] font-medium">Manager Portal</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2">
          {MANAGER_NAV.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-[#ea580c]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#ea580c]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#ea580c]' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-[#ea580c] font-bold text-sm">
              {user?.full_name?.charAt(user.full_name.length - 1)?.toUpperCase() || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {MANAGER_NAV.find((n) => pathname?.startsWith(n.href))?.label || 'Manager'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-[#ea580c] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              MANAGER
            </span>
            <Link href="/" className="text-sm text-gray-500 hover:text-[#ea580c] transition-colors">
              ← Về trang chủ
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
