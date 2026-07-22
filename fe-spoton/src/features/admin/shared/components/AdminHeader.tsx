"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { ADMIN_TEXTS } from '@/constants/texts/admin';

export function AdminHeader() {
  const { user, logout } = useAuth();
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

  // Hàm render danh mục menu phụ thuộc vào Role của User
  const renderRoleMenu = () => {
    if (!user) return null;

    if (user.role === 'ADMIN') {
      return (
        <>
          <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600 font-medium">{ADMIN_TEXTS.layout.header.home}</Link>
          <Link href="/admin/branches" className="block px-4 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold border-y border-amber-100">{ADMIN_TEXTS.layout.header.adminPortal}</Link>
          <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{ADMIN_TEXTS.layout.header.profile}</Link>
        </>
      );
    }

    if (user.role === 'MANAGER') {
      return (
        <>
          <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600 font-medium">{ADMIN_TEXTS.layout.header.home}</Link>
          <Link href="/manager/branch" className="block px-4 py-2 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold border-y border-amber-100">{ADMIN_TEXTS.layout.header.managerPortal}</Link>
          <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-amber-600">{ADMIN_TEXTS.layout.header.profile}</Link>
        </>
      );
    }

    return null;
  };

  return (
    <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 w-full z-50">
      <div className="w-96 flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-shadow">
        <Search className="w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder={ADMIN_TEXTS.layout.header.searchPlaceholder}
          className="outline-none text-sm w-full bg-transparent text-gray-700 placeholder:text-gray-400"
        />
      </div>
      <div className="flex items-center gap-5">
        <span className="text-sm font-bold text-gray-700">{ADMIN_TEXTS.layout.header.managementPortal}</span>
        <div className="w-px h-5 bg-gray-200 mx-1"></div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" strokeWidth={2} />
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <HelpCircle className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* Dropdown Avatar */}
        <div className="relative ml-2" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center focus:outline-none"
          >
            <img
              src={avatarSrc}
              alt="Avatar"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full border border-amber-500 object-cover shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-fade-in-down">
              {/* Info Header */}
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.full_name || ADMIN_TEXTS.layout.header.defaultUser}</p>
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
                {ADMIN_TEXTS.layout.header.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
