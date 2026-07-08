import React from 'react';
import { BranchProvider } from '@/features/admin/branch-management/branch-management.context';
import { AdminSidebar } from '@/features/admin/shared/components/AdminSidebar';
import { AdminFooter } from '@/features/admin/shared/components/AdminFooter';
import { AdminClientWrapper } from '@/features/admin/shared/components/AdminClientWrapper';
import { Navbar } from '@/components/ui/Navbar';
import { 
  BarChart3, 
  Users, 
  Store, 
  ListTree, 
  UtensilsCrossed, 
  Map, 
  Ticket, 
  Settings 
} from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Tổng quan', icon: BarChart3 },
  { href: '/admin/accounts', label: 'Tài khoản', icon: Users },
  { href: '/admin/branches', label: 'Chi nhánh', icon: Store },
  { href: '/admin/categories', label: 'Danh mục', icon: ListTree },
  { href: '/admin/menu', label: 'Thực đơn', icon: UtensilsCrossed },
  { href: '/admin/map-templates', label: 'Mẫu sơ đồ', icon: Map },
  { href: '/admin/vouchers', label: 'Khuyến mãi', icon: Ticket },
  { href: '/admin/system-configs', label: 'Cấu hình', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      {/* Header spanning full width */}
      <Navbar isAdmin={true} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative">
          <AdminClientWrapper>
            <BranchProvider>
              {children}
            </BranchProvider>
          </AdminClientWrapper>
        </main>

        {/* Footer */}
        {/* <AdminFooter /> */}
      </div>
    </div>
  </div>
  );
}
