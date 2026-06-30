import React from 'react';
import { BranchProvider } from '@/features/admin/branch-management/branch-management.context';
import { AdminSidebar } from '@/features/admin/shared/components/AdminSidebar';
import { AdminHeader } from '@/features/admin/shared/components/AdminHeader';
import { AdminFooter } from '@/features/admin/shared/components/AdminFooter';
import { AdminClientWrapper } from '@/features/admin/shared/components/AdminClientWrapper';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 w-full overflow-hidden bg-gray-50 h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Content */}

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
  );
}
