"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Store, UtensilsCrossed, BarChart3, CalendarDays, ClipboardCheck, Flame, LogOut, Ticket } from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';

const MANAGER_NAV = [
  { href: '/manager/branch', label: 'Chi nhánh', icon: Store },
  { href: '/manager/menus', label: 'Thực đơn', icon: UtensilsCrossed },
  { href: '/manager/bookings', label: 'Sơ đồ bàn', icon: CalendarDays },
  { href: '/manager/check-in', label: 'Check-in (Kanban)', icon: ClipboardCheck },
  { href: '/manager/kds', label: 'Hệ thống Bếp (KDS)', icon: Flame },
  { href: '/manager/stats', label: 'Thống kê', icon: BarChart3 },
  { href: '/manager/vouchers', label: 'Khuyến mãi', icon: Ticket },
];

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Header spanning full width */}
      <Navbar isAdmin={true} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0 h-full">
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-4">
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

        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page Content */}

        {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
