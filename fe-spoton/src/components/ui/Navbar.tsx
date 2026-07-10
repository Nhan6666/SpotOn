"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import logoImg from '@/assets/images/Logo-SpotOn-2.png';
import { COMMON_TEXTS } from '@/constants/texts/common';

export function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { navbar } = COMMON_TEXTS;

  // Xử lý click ra ngoài để tự động đóng Dropdown menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hàm render danh mục menu phụ thuộc vào Role của User
  const renderRoleMenu = () => {
    if (!user) return null;

    switch (user.role) {
      case 'CUSTOMER':
        return (
          <>
            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{navbar.roleMenu.customer.profile}</Link>
            <Link href="/my-bookings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{navbar.roleMenu.customer.history}</Link>
            <Link href="/support" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{navbar.roleMenu.customer.support}</Link>
          </>
        );
      case 'WAITER':
        return (
          <>
            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{navbar.roleMenu.waiter.profile}</Link>
            <Link href="/waiter/tables" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{navbar.roleMenu.waiter.tables}</Link>
            <Link href="/waiter/bookings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{navbar.roleMenu.waiter.bookings}</Link>
            <Link href="/waiter/dispatch" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{navbar.roleMenu.waiter.dispatch}</Link>
          </>
        );
      case 'MANAGER':
        return (
          <>
            <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600 font-medium">{navbar.roleMenu.manager.home}</Link>
            <Link href="/manager/branch" className="block px-4 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold border-y border-amber-100">{navbar.roleMenu.manager.dashboard}</Link>
            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{navbar.roleMenu.manager.profile}</Link>
          </>
        );
      case 'ADMIN':
        return (
          <>
            <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600 font-medium">{navbar.roleMenu.admin.home}</Link>
            <Link href="/admin/branches" className="block px-4 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold border-y border-amber-100">{navbar.roleMenu.admin.dashboard}</Link>
            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{navbar.roleMenu.admin.profile}</Link>
          </>
        );
      default:
        return null;
    }
  };

  // Xử lý logic Avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const words = name.trim().split(/\s+/);
    const lastWord = words[words.length - 1];
    return lastWord.charAt(0).toUpperCase();
  };

  const isOldDefaultAvatar = user?.avatar === 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
  const avatarSrc = user?.avatar && user.avatar.trim() !== "" && !isOldDefaultAvatar
    ? user.avatar
    : `https://ui-avatars.com/api/?name=${getInitials(user?.full_name)}&background=f59e0b&color=fff&length=1`;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">

        {/* === Logo === */}
        <Link href="/" className="flex items-center">
          <Image
            src={logoImg}
            alt="SpotOn Logo"
            className="h-16 w-auto object-contain"
            priority
          />
        </Link>

        {/* === Center Nav === */}
        {!isAdmin && (
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-amber-500 border-b-2 border-amber-500 pb-1">
              {navbar.home}
            </Link>
            <Link href="/branches" className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors pb-1 border-b-2 border-transparent hover:border-amber-500">
              {navbar.branches}
            </Link>
            <Link href="/menu" className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors pb-1 border-b-2 border-transparent hover:border-amber-500">
              {navbar.menus}
            </Link>
            <Link href="/promotions" className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors pb-1 border-b-2 border-transparent hover:border-amber-500">
              {navbar.promotions}
            </Link>
          </nav>
        )}

        {/* === Right Actions === */}
        <div className="flex items-center gap-4 sm:gap-6">




          {/* Logic Phân Quyền: Nếu đã đăng nhập thì hiện Avatar Menu, chưa thì hiện Nút Đăng Nhập */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border-2 border-amber-500 object-cover shadow-sm"
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-fade-in-down">
                  {/* Info Header */}
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>

                  {/* Render Menu Tương Ứng Với Quyền */}
                  {renderRoleMenu()}

                  <div className="h-px bg-gray-100 my-1"></div>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm cursor-pointer text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    {navbar.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="flex items-center justify-center px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-full transition-colors shadow-sm whitespace-nowrap">
              {navbar.login}
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}