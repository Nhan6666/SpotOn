import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Store, UtensilsCrossed, TicketPercent, BarChart3, Settings, Tags } from 'lucide-react';

export function AdminSidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0 h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-white font-bold">
          S
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">SpotOn</h1>
          <p className="text-xs text-gray-500 font-medium">Admin Portal</p>
        </div>
      </div>
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
        <Link href="/admin/system-configs" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-green-800 bg-green-100 rounded-md transition-colors relative mt-4">
          <Settings className="w-5 h-5 text-green-700" />
          System Configs
        </Link>
      </nav>
    </aside>
  );
}
