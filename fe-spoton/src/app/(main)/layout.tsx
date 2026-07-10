"use client";

import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isManager = pathname?.startsWith('/manager');
  const isWaiter = pathname?.startsWith('/waiter');
  const isKitchen = pathname?.startsWith('/kitchen');
  const hasOwnLayout = isAdmin || isManager || isWaiter || isKitchen;

  return (
    <>
      {!hasOwnLayout && <Navbar />}
      <div className="flex-1 w-full">{children}</div>
      {!hasOwnLayout && <Footer />}
    </>
  );
}
