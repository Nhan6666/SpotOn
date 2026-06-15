import React from 'react';
import { MenuProvider } from '@/features/admin/menu/menu.context';

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MenuProvider>
      {children}
    </MenuProvider>
  );
}
