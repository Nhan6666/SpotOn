"use client";

import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, Edit2, Trash2, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { useBranchContext } from '../branch-management.context';
import { DeactivateBranchModal } from './DeactivateBranchModal';

export function BranchGallery() {
  const { branches, isLoading } = useBranchContext();
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = 
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      branch.address.toLowerCase().includes(searchQuery.toLowerCase());
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
        return <Badge variant="success" className="bg-green-100 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>Open</Badge>;
      case 'FULL':
        return <Badge variant="danger" className="bg-red-50 text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>Full</Badge>;
      case 'CLOSED':
        return <Badge variant="default" className="bg-gray-100 text-gray-500"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>Closed</Badge>;
      case 'SETUP':
        return <Badge className="bg-yellow-100 text-yellow-700"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5"></span>Setup</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const branchImages = [
    'https://images.unsplash.com/photo-1504674900176-365891b894b7?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop',
  ];

  const getImageUrl = (index: number) => branchImages[index % branchImages.length];

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
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl(index)}
                    alt={branch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Overlay Badge */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(branch.status)}
                  </div>

                  {/* Capacity Overlay */}
                  {branch.status !== 'SETUP' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">Capacity</span>
                        <div className="flex-1 bg-white/30 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full ${(branch.current_capacity_percent || 0) > branch.overload_threshold ? 'bg-red-400' : 'bg-green-400'}`}
                            style={{ width: `${branch.current_capacity_percent || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-white">{branch.current_capacity_percent || 0}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-2">{branch.name}</h3>
                    </div>
                    <Dropdown 
                      align="right"
                      trigger={
                        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      }
                    >
                      <Link href={`/admin/branches/${branch._id}/edit`}>
                        <DropdownItem className="flex items-center gap-2">
                          <Edit2 className="w-4 h-4" />
                          Edit
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
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 line-clamp-2">{branch.address}</p>
                  </div>

                  {/* Hours */}
                  {branch.status !== 'SETUP' && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-gray-600 font-medium">{branch.open_time} - {branch.close_time}</p>
                    </div>
                  )}

                  {/* Manager */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Manager</p>
                    <p className="font-medium text-gray-900">
                      {branch.manager_id && typeof branch.manager_id === 'object' && branch.manager_id.full_name 
                        ? branch.manager_id.full_name 
                        : <span className="text-gray-400 italic">Unassigned</span>
                      }
                    </p>
                  </div>

                  {/* View Details Button */}
                  <Link href={`/admin/branches/${branch._id}/edit`} className="block">
                    <Button variant="outline" size="md" className="w-full text-amber-700 border-amber-200 hover:bg-amber-50">
                      View Details
                    </Button>
                  </Link>
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
    </>
  );
}
