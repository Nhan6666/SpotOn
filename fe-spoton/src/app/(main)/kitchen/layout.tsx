"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Flame } from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';

const KITCHEN_NAV = [
  { href: '/kitchen', label: 'Hệ thống Bếp (KDS)', icon: Flame },
];

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Header spanning full width */}
      <Navbar isAdmin={true} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0 h-full">
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-4">
          {KITCHEN_NAV.map((item) => {
            const isActive = pathname?.startsWith(item.href) || pathname === item.href;
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
          <main className="flex-1 overflow-auto bg-gray-50 p-6">
            <div className="max-w-[1400px] mx-auto w-full h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
