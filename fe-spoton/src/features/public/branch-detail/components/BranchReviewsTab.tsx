"use client";

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send, Calendar, User, Info } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/components/ui/Toast';
import { branchDetailService } from '../branch-detail.service';
import { BranchReview } from '../branch-detail.types';
import { Button } from '@/components/ui/Button';

export function BranchReviewsTab({ branchId }: { branchId: string }) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [reviews, setReviews] = useState<BranchReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [branchId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const data = await branchDetailService.getBranchReviews(branchId);
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toastError('Vui lòng đăng nhập để gửi đánh giá.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await branchDetailService.createReview(branchId, rating, comment);
      if (res.success) {
        toastSuccess(res.message || 'Gửi đánh giá thành công!');
        setComment('');
        setRating(5);
        fetchReviews(); // Refresh review list
      } else {
        toastError(res.message || 'Có lỗi xảy ra.');
      }
    } catch (err: any) {
      console.error(err);
      toastError(err.message || 'Có lỗi xảy ra khi gửi đánh giá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tính toán số liệu thống kê
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
    : 0;

  const starDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { stars, count, percentage };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* CỘT TRÁI: Thống kê & Form viết review */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Card Thống kê */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tổng quan đánh giá</h3>
          <div className="flex items-center gap-6 mb-6">
            <div className="text-center">
              <span className="text-5xl font-black text-gray-900 leading-none">{averageRating || '--'}</span>
              <span className="text-gray-400 block text-xs mt-1">trên 5 sao</span>
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={`w-5 h-5 ${s <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} 
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-500">{totalReviews} lượt đánh giá từ khách hàng</span>
            </div>
          </div>

          {/* Biểu đồ phân phối sao */}
          <div className="space-y-3">
            {starDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-3 text-sm">
                <span className="w-3 font-semibold text-gray-600 text-right">{stars}</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-[#ea580c] rounded-full transition-all duration-500" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-gray-400 text-right text-xs">{percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Viết Đánh Giá */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Đánh giá của bạn</h3>
          <p className="text-sm text-gray-500 mb-4">Chia sẻ trải nghiệm của bạn về món ăn, không gian và phục vụ của chi nhánh này.</p>
          
          {user ? (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              
              {/* Selector chọn sao */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Mức độ hài lòng</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starIdx) => {
                    const isActive = hoverRating !== null ? starIdx <= hoverRating : starIdx <= rating;
                    return (
                      <button
                        key={starIdx}
                        type="button"
                        onClick={() => setRating(starIdx)}
                        onMouseEnter={() => setHoverRating(starIdx)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="transition-all duration-150 transform hover:scale-110 focus:outline-none"
                      >
                        <Star 
                          className={`w-8 h-8 ${isActive ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                        />
                      </button>
                    );
                  })}
                  <span className="text-sm font-semibold text-gray-500 ml-2">
                    {rating === 5 && 'Rất tuyệt vời! 😍'}
                    {rating === 4 && 'Hài lòng! 😊'}
                    {rating === 3 && 'Bình thường! 😐'}
                    {rating === 2 && 'Không hài lòng! 🙁'}
                    {rating === 1 && 'Rất tệ! 😡'}
                  </span>
                </div>
              </div>

              {/* Textarea nhập bình luận */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Bình luận chi tiết</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Món ăn ngon, không gian ấm cúng, phục vụ chu đáo..."
                  rows={4}
                  required
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c] transition-all resize-none"
                />
              </div>

              {/* Button gửi */}
              <Button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-[#ea580c] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Gửi đánh giá
              </Button>
            </form>
          ) : (
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-center">
              <Info className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">Bạn cần đăng nhập tài khoản để có thể gửi đánh giá cho chi nhánh này.</p>
              <a 
                href={`/login?redirect=/branches/${branchId}`}
                className="inline-block bg-[#ea580c] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#c2410c] transition-colors shadow-sm"
              >
                Đăng nhập ngay
              </a>
            </div>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: Danh sách review từ khách */}
      <div className="lg:col-span-7">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            Đánh giá từ khách hàng ({totalReviews})
          </h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c] mb-3"></div>
              <p className="text-sm text-gray-400">Đang tải các đánh giá...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20">
              <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h4 className="text-base font-bold text-gray-800 mb-1">Chưa có đánh giá nào</h4>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">Hãy là người đầu tiên chia sẻ cảm nghĩ của bạn về chi nhánh này!</p>
            </div>
          ) : (
            <div className="space-y-6 divide-y divide-gray-100 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {reviews.map((rev, idx) => {
                const userName = rev.user_id?.full_name || 'Khách hàng';
                const userAvatar = rev.user_id?.avatar;
                const formattedDate = rev.created_at
                  ? new Date(rev.created_at).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '';

                return (
                  <div key={rev._id} className={`pt-6 ${idx === 0 ? 'pt-0' : ''} flex gap-4 items-start`}>
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center relative overflow-hidden text-amber-700 font-bold border border-amber-200 shadow-sm">
                      {userAvatar ? (
                        <img 
                          src={userAvatar} 
                          alt={userName} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <User className="w-5 h-5 text-amber-600" />
                      )}
                    </div>

                    {/* Nội dung review */}
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold text-gray-900 text-sm leading-snug">{userName}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {/* Hiển thị sao */}
                      <div className="flex items-center gap-0.5 py-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} 
                          />
                        ))}
                      </div>

                      {/* Comment text */}
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line pt-1">
                        {rev.comment}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
