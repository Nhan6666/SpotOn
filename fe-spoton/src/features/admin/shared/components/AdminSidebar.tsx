"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, UtensilsCrossed, TicketPercent, BarChart3, Settings, Tags, LayoutGrid, Map } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

const MENU_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/branches', label: 'Branch Management', icon: Store, matchPrefix: true },
  { href: '/admin/map-templates', label: 'Map Templates', icon: LayoutGrid, matchPrefix: true },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed, matchPrefix: true },
  { href: '/admin/categories', label: 'Categories', icon: Tags, matchPrefix: true },
  { href: '/admin/vouchers', label: 'Vouchers', icon: TicketPercent, matchPrefix: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, matchPrefix: true },
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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0 h-full">
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2">
        <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
          <LayoutDashboard className="w-5 h-5 text-slate-400" />
          Dashboard
        </Link>
        <Link href="/admin/branches" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
          <Store className="w-5 h-5 text-slate-400" />
          Branch Management
        </Link>
        <Link href="/admin/menu" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
          <UtensilsCrossed className="w-5 h-5 text-slate-400" />
          Menu
        </Link>
        <Link href="/admin/categories" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
          <Tags className="w-5 h-5 text-slate-400" />
          Categories
        </Link>
        <Link href="/admin/vouchers" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
          <TicketPercent className="w-5 h-5 text-slate-400" />
          Vouchers
        </Link>
        <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          Analytics
        </Link>
        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">System Configs</p>
        </div>
        <Link href="/admin/system-configs/booking-rules" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
          <Settings className="w-5 h-5 text-slate-400" />
          Booking Rules
        </Link>
        <Link href="/admin/system-configs/amenities" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
          <Tags className="w-5 h-5 text-slate-400" />
          Amenities
        </Link>
      </nav>
    </aside>
  );
}
