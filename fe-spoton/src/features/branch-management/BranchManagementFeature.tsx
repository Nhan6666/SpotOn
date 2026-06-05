"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BranchStatsCards } from './components/BranchStatsCards';
import { BranchList } from './components/BranchList';
import { BranchGallery } from './components/BranchGallery';

export function BranchManagementFeature() {
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Branch Management</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Monitor capacity, manage operations, and oversee regional branches.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('gallery')}
              className={`p-2 rounded transition-colors ${viewMode === 'gallery' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Gallery view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="List view"
            >
              <LayoutList className="w-5 h-5" />
            </button>
          </div>
          <Link href="/admin/branches/new" className="flex-1 md:flex-none">
            <Button variant="primary" size="lg" className="w-full shadow-sm">
              <Plus className="w-5 h-5 mr-2" />
              Add New Branch
            </Button>
          </Link>
        </div>
      </div>

      <BranchStatsCards />
      {viewMode === 'gallery' ? <BranchGallery /> : <BranchList />}
    </div>
  );
}
