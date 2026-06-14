"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import logoImg from '@/assets/images/Logo-SpotOn-2.png';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Hồ sơ cá nhân</Link>
            <Link href="/my-bookings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Lịch sử đặt bàn</Link>
            <Link href="/support" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Yêu cầu hỗ trợ</Link>
          </>
        );
      case 'WAITER':
        return (
          <>
            <Link href="/waiter/tables" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Quản lý bàn trực tiếp</Link>
            <Link href="/waiter/bookings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Danh sách đặt chỗ hôm nay</Link>
            <Link href="/waiter/dispatch" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Điều phối</Link>
          </>
        );
      case 'MANAGER':
        return (
          <>
            <Link href="/manager/branch" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Quản lý chi nhánh</Link>
            <Link href="/manager/menus" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Cập nhật Thực đơn</Link>
            <Link href="/manager/stats" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Thống kê</Link>
          </>
        );
      case 'ADMIN':
        return (
          <>
            <Link href="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Tổng quan hệ thống</Link>
            <Link href="/admin/branches" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Quản lý Chi nhánh</Link>
            <Link href="/admin/staff" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Quản lý Nhân sự</Link>
            <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">Cấu hình</Link>
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
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-amber-500 border-b-2 border-amber-500 pb-1">
            Trang chủ
          </Link>
          <Link href="/branches" className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors pb-1 border-b-2 border-transparent hover:border-amber-500">
            Chi nhánh
          </Link>
          <Link href="/menus" className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors pb-1 border-b-2 border-transparent hover:border-amber-500">
            Thực đơn
          </Link>
          <Link href="/promotions" className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors pb-1 border-b-2 border-transparent hover:border-amber-500">
            Khuyến mãi
          </Link>
        </nav>

        {/* === Right Actions === */}
        <div className="flex items-center gap-4 sm:gap-6">
          
          {/* Thanh tìm kiếm */}
          <div className="hidden lg:flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-100">
            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" placeholder="Tìm kiếm..." className="bg-transparent border-none outline-none text-sm w-32" />
          </div>
        

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
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="flex items-center justify-center px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-full transition-colors shadow-sm whitespace-nowrap">
              Đăng nhập
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}