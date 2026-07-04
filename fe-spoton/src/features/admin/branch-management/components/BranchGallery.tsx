"use client";

import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, Edit2, Trash2, MapPin, Clock, LayoutGrid, MonitorPlay, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { useBranchContext } from '../branch-management.context';
import { DeactivateBranchModal } from './DeactivateBranchModal';
import { ViewBranchDetailsModal } from './ViewBranchDetailsModal';

export function BranchGallery() {
  const { branches, isLoading } = useBranchContext();
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string } | null>(null);
  const [viewBranch, setViewBranch] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredBranches = branches.filter(branch => {
    const addressStr = typeof branch.address === 'object' ? branch.address.full : branch.address;
    const matchesSearch = 
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (addressStr || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || branch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeactivateClick = (id: string, name: string) => {
    setSelectedBranch({ id, name });
    setDeactivateModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 rounded-full text-green-700 text-[13px] font-bold shadow-sm backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
            Open
          </div>
        );
      case 'FULL':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 rounded-full text-red-700 text-[13px] font-bold shadow-sm backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            Full
          </div>
        );
      case 'CLOSED':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100/90 rounded-full text-gray-700 text-[13px] font-bold shadow-sm backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
            Closed
          </div>
        );
      case 'SETUP':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 rounded-full text-yellow-700 text-[13px] font-bold shadow-sm backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
            Setup
          </div>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getOperatingHours = (branch: any) => {
    if (branch.status === 'SETUP') return 'N/A';
    if (branch.service_periods) {
      return `${branch.service_periods.lunch?.start || '08:00'} - ${branch.service_periods.dinner?.end || '23:00'}`;
    }
    return `${branch.open_time || '08:00'} - ${branch.close_time || '23:00'}`;
  };

  const DEFAULT_IMAGE = 'https://placehold.co/600x400/f3f4f6/a1a1aa?text=No+Image';
  const getImageUrl = (branch: any) => {
    if (branch.images && Array.isArray(branch.images) && branch.images.length > 0 && branch.images[0]) {
      return branch.images[0];
    }
    return DEFAULT_IMAGE;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="w-full sm:max-w-md">
            <Input 
              placeholder="Search branch name or address..." 
              icon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dropdown 
            align="right"
            trigger={
              <Button variant="outline" className="bg-white" size="md">
                <Filter className="w-4 h-4 mr-2" />
                {statusFilter === "ALL" ? "All Status" : statusFilter}
              </Button>
            }
          >
            <DropdownItem onClick={() => setStatusFilter("ALL")}>All Status</DropdownItem>
            <DropdownItem onClick={() => setStatusFilter("OPEN")}>Open</DropdownItem>
            <DropdownItem onClick={() => setStatusFilter("FULL")}>Full</DropdownItem>
            <DropdownItem onClick={() => setStatusFilter("SETUP")}>Setup</DropdownItem>
          </Dropdown>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : filteredBranches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map((branch, index) => (
              <div key={branch._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                {/* Image Container */}
                <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl(branch)}
                    alt={branch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== DEFAULT_IMAGE) {
                        target.src = DEFAULT_IMAGE;
                      }
                    }}
                  />
                  
                  {/* Overlay Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    {getStatusBadge(branch.status)}
                  </div>

                  {/* Capacity Overlay */}
                  {branch.status !== 'SETUP' && (
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-end">
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-sm font-bold text-white drop-shadow-md">Capacity</span>
                        <div className="flex-1 bg-white/20 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
                          <div 
                            className={`h-full ${(branch.current_capacity_percent || 0) > branch.overload_threshold ? 'bg-red-500' : 'bg-white'}`}
                            style={{ width: `${branch.current_capacity_percent || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-white drop-shadow-md">{branch.current_capacity_percent || 0}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-extrabold text-gray-900 text-2xl line-clamp-1">{branch.name}</h3>
                    </div>
                    <Dropdown 
                      align="right"
                      trigger={
                        <button className="text-gray-400 hover:text-gray-700 p-1 -mr-2 rounded-md hover:bg-gray-100 transition-colors">
                          <MoreHorizontal className="w-6 h-6" />
                        </button>
                      }
                    >
                      <Link href={`/admin/branches/${branch._id}/edit`}>
                        <DropdownItem className="flex items-center gap-2">
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </DropdownItem>
                      </Link>
                      <Link href={`/admin/branches/${branch._id}/map-editor`}>
                        <DropdownItem className="flex items-center gap-2">
                          <LayoutGrid className="w-4 h-4" />
                          Floor Plan
                        </DropdownItem>
                      </Link>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <DropdownItem 
                        danger
                        className="flex items-center gap-2"
                        onClick={() => handleDeactivateClick(branch._id, branch.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Deactivate
                      </DropdownItem>
                    </Dropdown>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0" strokeWidth={1.5} />
                    <p className="text-gray-600 line-clamp-1 font-medium">{typeof branch.address === 'object' ? branch.address.district : branch.address}</p>
                  </div>

                  {/* Hours */}
                  {branch.status !== 'SETUP' && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
                      <p className="text-gray-700 font-bold">{getOperatingHours(branch)}</p>
                    </div>
                  )}

                  <div className="w-full h-px bg-gray-100/80 my-2"></div>

                  {/* Manager */}
                  <div>
                    <p className="text-[13px] text-gray-500 mb-1">Manager</p>
                    <p className="font-bold text-gray-900 text-lg">
                      {branch.manager_id && typeof branch.manager_id === 'object' && branch.manager_id.full_name 
                        ? branch.manager_id.full_name 
                        : <span className="text-gray-400 italic font-medium">Unassigned</span>
                      }
                    </p>
                  </div>

                  {/* View Details Button */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      size="md" 
                      className="flex-1 text-gray-700 border-gray-200 hover:bg-gray-50 font-bold"
                      onClick={() => { setViewBranch(branch); setDetailsModalOpen(true); }}
                    >
                      View Details
                    </Button>
                    <Link href={`/admin/branches/${branch._id}/map-editor`}>
                      <Button variant="outline" size="md" className="text-gray-600 border-gray-200 hover:bg-gray-50 px-3" title="Floor Plan">
                        <LayoutGrid className="w-5 h-5" strokeWidth={1.5} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No branches found matching your filters.</p>
          </div>
        )}
      </div>

      {selectedBranch && (
        <DeactivateBranchModal 
          isOpen={deactivateModalOpen}
          onClose={() => setDeactivateModalOpen(false)}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
        />
      )}

      <ViewBranchDetailsModal 
        isOpen={detailsModalOpen} 
        onClose={() => setDetailsModalOpen(false)} 
        branch={viewBranch} 
      />
    </>
  );
}
