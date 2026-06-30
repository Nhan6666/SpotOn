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
  { href: '/admin/system-configs', label: 'System Configs', icon: Settings, matchPrefix: true },
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
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-white font-bold">
          S
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">SpotOn</h1>
          <p className="text-xs text-gray-500 font-medium">
            {user?.role === 'MANAGER' ? 'Management Portal' : 'Admin Portal'}
          </p>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2">
        {visibleMenuItems.map((item) => {
          const itemHref = user?.role === 'MANAGER' ? item.href.replace('/admin', '/manager') : item.href;
          const isActive = item.matchPrefix 
            ? pathname.startsWith(itemHref)
            : pathname === itemHref;
            
          return (
            <Link 
              key={item.href}
              href={itemHref} 
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                isActive 
                  ? "bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-100" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-amber-700"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
