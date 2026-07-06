"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, UtensilsCrossed, TicketPercent, BarChart3, Settings, Tags, LayoutGrid, Map } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const MENU_ITEMS = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/branches', label: 'Quản lý Chi nhánh', icon: Store, matchPrefix: true },
  { href: '/admin/map-templates', label: 'Mẫu Sơ đồ bàn', icon: LayoutGrid, matchPrefix: true },
  { href: '/admin/menu', label: 'Thực đơn', icon: UtensilsCrossed, matchPrefix: true },
  { href: '/admin/categories', label: 'Danh mục', icon: Tags, matchPrefix: true },
  { href: '/admin/vouchers', label: 'Khuyến mãi', icon: TicketPercent, matchPrefix: true },
  { href: '/admin/analytics', label: 'Phân tích', icon: BarChart3, matchPrefix: true },
];

const SYSTEM_CONFIGS = [
  { href: '/admin/system-configs/booking-rules', label: 'Chính sách đặt bàn', icon: Settings, matchPrefix: true },
  { href: '/admin/system-configs/amenities', label: 'Tiện ích', icon: Tags, matchPrefix: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const getMenuItems = () => {
    let items = [...MENU_ITEMS];
    
    if (user?.role === 'MANAGER') {
      items = items.filter(item => item.href !== '/admin/map-templates');
      const branchItem = items.find(i => i.href === '/admin/branches');
      if (branchItem) {
        branchItem.label = 'Chi nhánh của tôi';
      }
    } else if (user?.role === 'ADMIN') {
      // Admin sees Map Templates, no specific branch map shortcut
    }

    return items;
  };

  const visibleMenuItems = getMenuItems();

  const renderLink = (item: any) => {
    const isActive = item.matchPrefix && item.href !== '/admin'
      ? pathname.startsWith(item.href)
      : pathname === item.href;

    const activeClass = isActive
      ? 'bg-amber-50 text-amber-700 font-semibold'
      : 'text-slate-600 hover:bg-slate-50 hover:text-amber-700 font-medium';

    const iconClass = isActive ? 'text-amber-600' : 'text-slate-400';

    return (
      <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors ${activeClass}`}>
        <item.icon className={`w-5 h-5 ${iconClass}`} />
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0 h-full">
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2">
        {visibleMenuItems.map(renderLink)}
        
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cấu hình hệ thống</p>
        </div>
        
        {SYSTEM_CONFIGS.map(renderLink)}
      </nav>
    </aside>
  );
}
