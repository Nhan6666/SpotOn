"use client";

import React, { useEffect, useState } from 'react';
import { Star, Trash2, Search, Filter, AlertTriangle, CheckCircle, MessageSquare, ShieldAlert, Sparkles, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { branchDetailService } from '@/features/public/branch-detail/branch-detail.service';
import { BranchReview } from '@/features/public/branch-detail/branch-detail.types';

export default function AdminReviewsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [reviews, setReviews] = useState<BranchReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'DELETED'

  // Modal deletion state
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; reviewId: string; userName: string }>({
    open: false,
    reviewId: '',
    userName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const data = await branchDetailService.getAdminReviews();
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to fetch admin reviews:', err);
      toastError('Không thể tải danh sách đánh giá.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (review: BranchReview) => {
    setDeleteModal({
      open: true,
      reviewId: review._id || (review as any).id,
      userName: review.user_id?.full_name || 'Khách hàng',
    });
  };

  const handleConfirmDelete = async () => {
    const targetId = deleteModal.reviewId;
    if (!targetId) return;

    setIsDeleting(true);
    try {
      const res = await branchDetailService.deleteAdminReview(targetId);
      if (res.success) {
        toastSuccess('Đã ẩn đánh giá thành công (Soft Delete).');
        setDeleteModal({ open: false, reviewId: '', userName: '' });
        fetchReviews(); // Reload data
      } else {
        toastError(res.message || 'Lỗi khi ẩn đánh giá.');
      }
    } catch (err: any) {
      console.error(err);
      toastError(err.message || 'Lỗi hệ thống khi xoá đánh giá.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get unique branches for filtering
  const branchesList = Array.from(new Set(reviews.map(r => r.branch_id?.name).filter(Boolean)));

  // Filter reviews
  const filteredReviews = reviews.filter(rev => {
    // Search filter (name or comment)
    const matchesSearch = 
      (rev.user_id?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rev.comment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rev.user_id?.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Branch filter
    const matchesBranch = branchFilter === 'ALL' || rev.branch_id?.name === branchFilter;

    // Rating filter
    const matchesRating = ratingFilter === 'ALL' || rev.rating.toString() === ratingFilter;

    // Status filter (soft-deleted / active)
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'DELETED' && rev.is_deleted) ||
      (statusFilter === 'ACTIVE' && !rev.is_deleted);

    return matchesSearch && matchesBranch && matchesRating && matchesStatus;
  });

  // Calculate statistics
  const totalReviews = reviews.length;
  const activeReviews = reviews.filter(r => !r.is_deleted).length;
  const deletedReviews = reviews.filter(r => r.is_deleted).length;
  const activeAvgRating = activeReviews > 0
    ? Number((reviews.filter(r => !r.is_deleted).reduce((sum, r) => sum + r.rating, 0) / activeReviews).toFixed(1))
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-[#ea580c]" />
            Quản lý đánh giá
          </h1>
          <p className="text-sm text-slate-500">
            Xem toàn bộ đánh giá của khách hàng đối với các chi nhánh, kiểm duyệt và ẩn đánh giá không phù hợp.
          </p>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider block">Tổng đánh giá</span>
            <span className="text-3xl font-black text-slate-800 block mt-1">{totalReviews}</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider block">Đang hoạt động</span>
            <span className="text-3xl font-black text-emerald-600 block mt-1">{activeReviews}</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider block">Điểm đánh giá trung bình</span>
            <span className="text-3xl font-black text-amber-500 block mt-1 flex items-center gap-1.5">
              {activeAvgRating || '--'}
              <Star className="w-6 h-6 fill-amber-400 text-amber-400 inline" />
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider block">Đã ẩn (Soft deleted)</span>
            <span className="text-3xl font-black text-rose-500 block mt-1">{deletedReviews}</span>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-700">Bộ lọc tìm kiếm</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Query */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên khách, nội dung..."
              className="pl-9 h-10 w-full"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/10"
            >
              <option value="ALL">Tất cả chi nhánh</option>
              {branchesList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/10"
            >
              <option value="ALL">Tất cả số sao</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#ea580c]/10"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hiển thị</option>
              <option value="DELETED">Đã ẩn (Soft deleted)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ea580c] mb-3"></div>
            <span className="text-sm text-slate-400 font-medium">Đang tải danh sách đánh giá...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-14 h-14 text-slate-200 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 mb-1">Không tìm thấy đánh giá nào</h3>
            <p className="text-sm text-slate-400">Thử thay đổi bộ lọc tìm kiếm của bạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Chi nhánh</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Đánh giá</th>
                  <th className="px-6 py-4">Nội dung</th>
                  <th className="px-6 py-4">Ngày gửi</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredReviews.map((rev) => {
                  const branchName = rev.branch_id?.name || 'Chi nhánh ẩn';
                  const userName = rev.user_id?.full_name || 'Không xác định';
                  const userEmail = rev.user_id?.email || '';
                  const formattedDate = rev.created_at
                    ? new Date(rev.created_at).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  return (
                    <tr key={rev._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Chi nhánh */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">{branchName}</span>
                      </td>

                      {/* Khách hàng */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{userName}</span>
                          <span className="text-xs text-slate-400 mt-0.5">{userEmail}</span>
                        </div>
                      </td>

                      {/* Đánh giá (Sao) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                            />
                          ))}
                        </div>
                      </td>

                      {/* Nội dung bình luận */}
                      <td className="px-6 py-4 max-w-xs md:max-w-md">
                        <p className="text-slate-600 line-clamp-2 leading-relaxed" title={rev.comment}>
                          {rev.comment || <em className="text-slate-400">(Không viết bình luận)</em>}
                        </p>
                      </td>

                      {/* Ngày gửi */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {formattedDate}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rev.is_deleted ? (
                          <Badge variant="destructive" className="bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-50">
                            Đã ẩn
                          </Badge>
                        ) : (
                          <Badge variant="success" className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-50">
                            Hiển thị
                          </Badge>
                        )}
                      </td>

                      {/* Hành động */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {rev.is_deleted ? (
                          <span className="text-xs text-slate-400 italic">N/A</span>
                        ) : (
                          <Button
                            onClick={() => handleDeleteClick(rev)}
                            variant="destructive"
                            size="sm"
                            className="bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all rounded-lg p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, reviewId: '', userName: '' })}
        title="Xác nhận ẩn đánh giá"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-800 text-sm">Hành động kiểm duyệt (Soft Delete)</h4>
              <p className="text-xs text-amber-700 leading-relaxed mt-1">
                Đánh giá này sẽ bị ẩn hoàn toàn khỏi chi nhánh phía khách hàng, nhưng vẫn được lưu lại trong cơ sở dữ liệu để Admin đối soát.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Bạn có chắc chắn muốn ẩn đánh giá của khách hàng <strong className="text-slate-800">{deleteModal.userName}</strong> không?
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, reviewId: '', userName: '' })}
              disabled={isDeleting}
              className="h-10 px-4 rounded-xl border-slate-200 text-slate-600"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="h-10 px-4 rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {isDeleting ? 'Đang ẩn...' : 'Xác nhận ẩn'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
