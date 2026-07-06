"use client";

import React, { useState } from 'react';
import { Search, Filter, Download, MoreHorizontal, ChevronLeft, ChevronRight, Edit2, Trash2, LayoutGrid, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { useBranchContext } from '../branch-management.context';
import { DeactivateBranchModal } from './DeactivateBranchModal';
import { ViewBranchDetailsModal } from './ViewBranchDetailsModal';
import Link from 'next/link';

export function BranchList() {
  const { branches, isLoading, updateBranch } = useBranchContext();
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<{ id: string; name: string } | null>(null);
  const [viewBranch, setViewBranch] = useState<any>(null);

  // Search, Filter, Pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Compute filtered branches
  const filteredBranches = branches.filter(branch => {
    const searchLower = searchQuery.toLowerCase();
    
    // 1. Mã UI (VD: SP-32B1)
    const uiCode = `SP-${branch._id.substring(branch._id.length - 4)}`.toLowerCase();
    
    // 2. Tên chi nhánh
    const branchName = (branch.name || '').toLowerCase();
    
    // 3. Địa chỉ (kết hợp full, district, city)
    let addressStr = '';
    if (typeof branch.address === 'object' && branch.address !== null) {
      addressStr = `${branch.address.full || ''} ${branch.address.district || ''} ${branch.address.city || ''} ${branch.address.ward || ''}`.toLowerCase();
    } else if (typeof branch.address === 'string') {
      addressStr = branch.address.toLowerCase();
    }

    // 4. Tên quản lý
    let managerStr = '';
    if (branch.manager_id && typeof branch.manager_id === 'object' && branch.manager_id.full_name) {
      managerStr = branch.manager_id.full_name.toLowerCase();
    }

    const matchesSearch = 
      branchName.includes(searchLower) || 
      uiCode.includes(searchLower) ||
      branch._id.toLowerCase().includes(searchLower) || // Giữ lại dự phòng
      addressStr.includes(searchLower) ||
      managerStr.includes(searchLower);

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

  const handleToggleStatus = async (branch: any) => {
    try {
      const newStatus = branch.status === 'OPEN' || branch.status === 'FULL' ? 'CLOSED' : 'OPEN';
      await updateBranch(branch._id, { status: newStatus });
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('Không thể cập nhật trạng thái chi nhánh. Vui lòng thử lại.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <div className="flex flex-col items-center">
            <div className="w-12 h-6 bg-amber-400 rounded-full flex items-center p-1 mb-1">
              <div className="w-4 h-4 bg-gray-900 rounded-full shadow-sm ml-auto"></div>
            </div>
            <span className="text-[10px] font-bold text-gray-700 uppercase">MỞ CỬA</span>
          </div>
        );
      case 'FULL':
        return (
          <div className="flex flex-col items-center">
            <div className="w-12 h-6 bg-red-500 rounded-full flex items-center p-1 mb-1">
              <div className="w-4 h-4 bg-white rounded-full shadow-sm ml-auto"></div>
            </div>
            <span className="text-[10px] font-bold text-gray-700 uppercase">HẾT BÀN</span>
          </div>
        );
      case 'CLOSED':
        return (
          <div className="flex flex-col items-center">
            <div className="w-12 h-6 bg-gray-300 rounded-full flex items-center p-1 mb-1">
              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">ĐÓNG CỬA</span>
          </div>
        );
      case 'SETUP':
        return (
          <div className="flex flex-col items-center">
            <div className="w-12 h-6 bg-blue-400 rounded-full flex items-center p-1 mb-1">
              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
            <span className="text-[10px] font-bold text-gray-600 uppercase">SETUP</span>
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="w-full sm:max-w-md">
            <Input 
              placeholder="Tìm theo Mã, Tên, Địa chỉ, Quản lý..." 
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
              <tr className="bg-white border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 rounded-tl-lg font-bold">MÃ CHI NHÁNH</th>
                <th className="px-6 py-4 font-bold">HÌNH ẢNH</th>
                <th className="px-6 py-4 font-bold">THÔNG TIN</th>
                <th className="px-6 py-4 font-bold">LIÊN HỆ</th>
                <th className="px-6 py-4 font-bold">TRẠNG THÁI</th>
                <th className="px-6 py-4 rounded-tr-lg font-bold">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                    </div>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paginatedBranches.length > 0 ? (
                paginatedBranches.map((branch) => (
                  <tr key={branch._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-6 whitespace-nowrap align-top">
                      <span className="font-bold text-gray-900 text-[15px]">SP-{branch._id.substring(branch._id.length - 4).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap align-top">
                      <div className="w-24 h-16 rounded-md overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                        <img 
                          src={getImageUrl(branch)} 
                          alt={branch.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== DEFAULT_IMAGE) target.src = DEFAULT_IMAGE;
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-6 align-top">
                      <div className="font-bold text-gray-900 text-[15px] mb-2 max-w-sm line-clamp-2 leading-snug group-hover:text-amber-700 transition-colors">
                        {branch.name}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {typeof branch.address === 'object' ? `${branch.address.district}, ${branch.address.city}` : branch.address}
                        <span className="mx-2 text-gray-300">•</span>
                        {getOperatingHours(branch)}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap align-top">
                      <div className="text-[15px] font-medium text-gray-900 mb-1">
                        {branch.manager_id && typeof branch.manager_id === 'object' && branch.manager_id.full_name ? branch.manager_id.full_name : <span className="text-gray-400 italic">Chưa chỉ định</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {branch.hotline || <span className="italic text-gray-400">Không có</span>}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap align-top text-center">
                      <div 
                        onClick={() => handleToggleStatus(branch)} 
                        className="cursor-pointer hover:opacity-80 transition-opacity inline-block"
                        title="Nhấn để chuyển đổi trạng thái"
                      >
                        {getStatusBadge(branch.status)}
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap align-top text-center">
                      <div className="flex items-center justify-center gap-4">
                        <button 
                          onClick={() => { setViewBranch(branch); setDetailsModalOpen(true); }}
                          className="text-gray-400 hover:text-green-600 transition-colors" 
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <Link href={`/admin/branches/${branch._id}/edit`} className="text-gray-400 hover:text-amber-600 transition-colors" title="Chỉnh sửa">
                          <Edit2 className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => handleDeactivateClick(branch._id, branch.name)}
                          className="text-gray-400 hover:text-red-600 transition-colors" 
                          title="Xóa / Vô hiệu hóa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy chi nhánh nào phù hợp.
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
      
      <ViewBranchDetailsModal 
        isOpen={detailsModalOpen} 
        onClose={() => setDetailsModalOpen(false)} 
        branch={viewBranch} 
      />
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
