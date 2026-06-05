"use client";

import React, { useState } from 'react';
import { Search, Filter, Download, MoreHorizontal, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { useBranchContext } from '../branch-management.context';
import { DeactivateBranchModal } from './DeactivateBranchModal';
import Link from 'next/link';

export function BranchList() {
  const { branches } = useBranchContext();
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string } | null>(null);

  // Search, Filter, Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Compute filtered branches
  const filteredBranches = branches.filter(branch => {
    const matchesSearch = 
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      branch._id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || branch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Compute paginated branches
  const totalPages = Math.ceil(filteredBranches.length / ITEMS_PER_PAGE) || 1;
  // Ensure current page is valid when filtering changes
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBranches = filteredBranches.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 on search or filter
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleDeactivateClick = (id: string, name: string) => {
    setSelectedBranch({ id, name });
    setDeactivateModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-100"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>ACTIVE</Badge>;
      case 'FULL':
        return <Badge variant="danger" className="bg-red-50 text-red-700 hover:bg-red-50"><span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>FULL</Badge>;
      case 'SETUP':
        return <Badge variant="default" className="bg-gray-100 text-gray-600 hover:bg-gray-100"><ClockIcon /> SETUP</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="w-full sm:max-w-md">
            <Input 
              placeholder="Search branch name or ID..." 
              icon={<Search className="w-4 h-4" />}
              className="bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
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
              <DropdownItem onClick={() => setStatusFilter("OPEN")}>OPEN</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter("FULL")}>FULL</DropdownItem>
              <DropdownItem onClick={() => setStatusFilter("SETUP")}>SETUP</DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="px-6 py-4 rounded-tl-lg">Branch & ID</th>
                <th className="px-6 py-4">Manager</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Operating Hours</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4 text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedBranches.length > 0 ? (
                paginatedBranches.map((branch) => (
                  <tr key={branch._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mr-3">
                        {branch.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors">{branch.name}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-0.5">
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono mr-2">
                            {branch._id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {branch.manager_name ? (
                      <div className="text-sm font-medium text-gray-900">{branch.manager_name}</div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">Unassigned</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(branch.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 font-medium">
                      {branch.status === 'SETUP' ? 'N/A' : `${branch.open_time} - ${branch.close_time}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {branch.status === 'SETUP' ? (
                      <span className="text-sm text-gray-400 italic">N/A</span>
                    ) : (
                      <div className="flex items-center w-32">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 mr-3 overflow-hidden flex">
                          <div 
                            className={`h-2 rounded-full ${(branch.current_capacity_percent || 0) > branch.overload_threshold ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${branch.current_capacity_percent}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-bold ${(branch.current_capacity_percent || 0) > branch.overload_threshold ? 'text-red-600' : 'text-gray-600'}`}>
                          {branch.current_capacity_percent}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
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
                          Edit Branch
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
                  </td>
                </tr>
              ))) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No branches found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 rounded-b-xl">
          <div className="text-sm text-gray-500">
            Showing {filteredBranches.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredBranches.length)} of {filteredBranches.length} branches
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="px-3"
              disabled={validCurrentPage === 1}
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button 
                key={page}
                variant="outline" 
                className={`px-3 ${validCurrentPage === page ? 'bg-gray-100 font-bold' : ''}`}
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {page}
              </Button>
            ))}

            <Button 
              variant="outline" 
              className="px-3"
              disabled={validCurrentPage === totalPages}
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
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

function ClockIcon() {
  return (
    <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
