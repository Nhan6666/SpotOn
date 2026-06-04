import React from 'react';
import { LayoutDashboard, Store, Users, BarChart3, Settings } from 'lucide-react';
import { BranchProvider } from '@/features/branch-management/branch-management.context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 w-full overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0">
        <div className="p-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Management Portal</h2>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
            <LayoutDashboard className="w-5 h-5 text-slate-400" />
            Overview
          </a>
          <a href="/admin/branches" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-amber-800 bg-amber-50 rounded-md transition-colors relative">
            <div className="absolute left-0 top-1 bottom-1 w-1 bg-amber-600 rounded-r-md"></div>
            <Store className="w-5 h-5 text-amber-600" />
            Branches
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
            <Users className="w-5 h-5 text-slate-400" />
            Staff Directory
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            Reports
          </a>
        </nav>
        <div className="p-3 border-t border-gray-200 mt-auto">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-amber-700 transition-colors">
            <Settings className="w-5 h-5 text-slate-400" />
            Settings
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <BranchProvider>
          {children}
        </BranchProvider>
      </main>
    </div>
  );
}
