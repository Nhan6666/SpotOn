"use client";

import React, { useEffect, useState } from 'react';
import { http } from '@/lib/http';
import { Search, Filter, Edit2, ShieldAlert, CheckCircle2, UserCog } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import Image from 'next/image';

interface Branch {
  _id: string;
  name: string;
  address?: { full: string };
}

interface UserAccount {
  _id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'WAITER' | 'CUSTOMER';
  avatar?: string;
  auth_provider: string;
  branch_id?: Branch;
  created_at: string;
}

export function AccountsFeature() {
  const { user: currentUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [editRole, setEditRole] = useState<'ADMIN' | 'MANAGER' | 'WAITER' | 'CUSTOMER'>('CUSTOMER');
  const [editBranchId, setEditBranchId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, branchesRes] = await Promise.all([
        http.get<{ success: boolean; data: UserAccount[] }>('/users/admin/list'),
        http.get<{ success: boolean; data: Branch[] }>('/branches')
      ]);

      if (usersRes.success) setUsers(usersRes.data);
      if (branchesRes.success) setBranches(branchesRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user: UserAccount) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditBranchId(user.branch_id?._id || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    
    try {
      const payload: any = { role: editRole };
      if (editRole === 'MANAGER' || editRole === 'WAITER') {
        if (!editBranchId) {
          toastError('Vui lòng chọn chi nhánh phân công cho nhân viên này.');
          setIsUpdating(false);
          return;
        }
        payload.branch_id = editBranchId;
      }

      await http.put(`/users/admin/${selectedUser._id}/role`, payload);
      
      toastSuccess('Cập nhật quyền tài khoản thành công!');
      setIsEditModalOpen(false);
      fetchData(); // Refresh list
    } catch (error: any) {
      console.error("Lỗi cấp quyền:", error);
      toastError(error.response?.data?.message || 'Có lỗi xảy ra khi cấp quyền.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700 border-red-200';
      case 'MANAGER': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'WAITER': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Quản lý Tài khoản</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Phân quyền hệ thống và quản lý nhân sự cho các chi nhánh.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input 
            placeholder="Tìm theo tên hoặc email..." 
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-5 h-5 text-gray-500" />
          <select 
            className="flex-1 md:w-48 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:border-transparent"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
            <option value="MANAGER">Quản lý (MANAGER)</option>
            <option value="WAITER">Nhân viên (WAITER)</option>
            <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                <th className="px-6 py-4">Tài khoản</th>
                <th className="px-6 py-4">SĐT</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Chi nhánh phân công</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#ea580c]"></div>
                      Đang tải danh sách...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy tài khoản nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                          {user.avatar ? (
                            <Image src={user.avatar} alt={user.full_name} width={40} height={40} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 font-bold">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(user.role === 'MANAGER' || user.role === 'WAITER') ? (
                        user.branch_id ? (
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{user.branch_id.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.branch_id.address?.full}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-red-500 font-medium">Chưa phân công</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {currentUser?._id !== user._id && user.role !== 'ADMIN' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClick(user)}
                          className="text-[#ea580c] border-[#ea580c] hover:bg-orange-50"
                        >
                          <UserCog className="w-4 h-4 mr-1.5" />
                          Sửa quyền
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} đến {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} trong số {filteredUsers.length} kết quả
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <span className="flex items-center px-3 py-1 text-sm font-medium bg-gray-100 rounded-md">
                {currentPage} / {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Phân quyền tài khoản</h3>
            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
              <ShieldAlert className="w-6 h-6" />
            </button>
          </div>

          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white shrink-0">
                  {selectedUser.avatar ? (
                    <Image src={selectedUser.avatar} alt="avatar" width={48} height={48} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-lg">
                      {selectedUser.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selectedUser.full_name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vai trò (Role)</label>
                <select 
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:border-transparent"
                  value={editRole}
                  onChange={(e: any) => setEditRole(e.target.value)}
                >
                  <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                  <option value="WAITER">Nhân viên phục vụ (WAITER)</option>
                  <option value="MANAGER">Quản lý chi nhánh (MANAGER)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">
                  Tài khoản đã phân quyền không thể tự khôi phục thành Quản trị viên.
                </p>
              </div>

              {(editRole === 'MANAGER' || editRole === 'WAITER') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chi nhánh phân công</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea580c] focus:border-transparent"
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                  >
                    <option value="" disabled>-- Chọn chi nhánh --</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Tài khoản {editRole} bắt buộc phải được gán vào 1 chi nhánh cụ thể.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                >
                  Hủy bỏ
                </Button>
                <Button 
                  className="flex-1 bg-[#ea580c] hover:bg-[#c2410c] text-white"
                  onClick={handleUpdateRole}
                  disabled={isUpdating || ((editRole === 'MANAGER' || editRole === 'WAITER') && !editBranchId)}
                >
                  {isUpdating ? 'Đang lưu...' : 'Lưu cập nhật'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
