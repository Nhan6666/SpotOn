import React from 'react';
import Image from 'next/image';
import { LayoutDashboard, Store, UtensilsCrossed, TicketPercent, BarChart3, Settings, Search, Bell, HelpCircle } from 'lucide-react';
import { BranchProvider } from '@/features/branch-management/branch-management.context';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 w-full overflow-hidden bg-gray-50 h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0">
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-xl font-bold text-amber-600">SpotOn Admin</h2>
          <div className="flex items-center gap-6">
            <button className="text-gray-500 hover:text-gray-700">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-6 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-amber-700">AD</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Profile</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <BranchProvider>
            {children}
          </BranchProvider>
        </main>
      </div>
    </div>
  );
}
