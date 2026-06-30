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
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/manager');

  return (
    <>
      <Navbar />
      <div className="flex-1 w-full">{children}</div>
      {!isAdmin && <Footer />}
    </>
  );
}
