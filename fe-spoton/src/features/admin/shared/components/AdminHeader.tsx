import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="h-[72px] bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0 w-full z-20">
      <div className="w-96 flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-shadow">
        <Search className="w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search menu items, categories..." 
          className="outline-none text-sm w-full bg-transparent text-gray-700 placeholder:text-gray-400"
        />
      </div>
      <div className="flex items-center gap-5">
        <span className="text-sm font-bold text-gray-700">Management Portal</span>
        <div className="w-px h-5 bg-gray-200 mx-1"></div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" strokeWidth={2} />
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <HelpCircle className="w-5 h-5" strokeWidth={2} />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#3b82f6] ml-2 flex items-center justify-center cursor-pointer shadow-sm hover:opacity-90 transition-opacity">
          <div className="w-4 h-4 border-[1.5px] border-white border-b-transparent rounded-full relative">
            <div className="w-1.5 h-1.5 bg-white rounded-full absolute -top-0.5 -right-0.5"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
