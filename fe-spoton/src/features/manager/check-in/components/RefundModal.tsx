import React, { useState, useRef } from 'react';
import { X, Undo2, Upload, AlertTriangle, Camera, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { checkInService } from '../check-in.service';

interface RefundModalProps {
  booking: {
    _id: string;
    status?: string;
    customer_id?: { full_name: string; phone: string };
    walk_in_name?: string;
    walk_in_phone?: string;
    assigned_tables?: { table_number: string }[];
    total_deposit_paid?: number;
    amount_collected?: number;
    final_bill_amount?: number;
    refund_info?: { 
      refund_amount?: number;
      bank_account_number?: string;
      bank_name?: string;
      account_holder_name?: string;
    };
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const REFUND_TYPES = [
  { value: 'DEPOSIT_DIFF', label: 'Chênh lệch cọc (đổi món rẻ hơn)' },
  { value: 'CANCEL_POLICY', label: 'Hủy bàn (theo chính sách hoàn tiền)' },
  { value: 'QUALITY_ISSUE', label: 'Khách than phiền chất lượng' },
  { value: 'GOODWILL', label: 'Goodwill (thiện chí nhà hàng)' },
  { value: 'OTHER', label: 'Lý do khác' },
];

export function RefundModal({ booking, onClose, onSuccess }: RefundModalProps) {
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'FORM' | 'CONFIRM'>('FORM');

  const [refundAmount, setRefundAmount] = useState(booking?.refund_info?.refund_amount ? String(booking.refund_info.refund_amount) : '');
  const [refundType, setRefundType] = useState(booking?.refund_info?.bank_account_number ? 'CANCEL_POLICY' : 'QUALITY_ISSUE');
  const [reason, setReason] = useState(booking?.refund_info?.bank_account_number ? 'Hoàn tiền hủy bàn theo yêu cầu của khách.' : '');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!booking) return null;

  const customerName = booking.customer_id?.full_name || booking.walk_in_name || 'Khách vãng lai';
  const tableNames = booking.assigned_tables?.map(t => t.table_number).join(', ') || 'N/A';
  
  // ============================================================
  // KIẾN TRÚC TÀI CHÍNH: Tính trần hoàn tiền theo loại đơn
  // - CANCELLED_REFUND_PENDING: Khách chỉ mới đóng cọc, chưa checkout
  //   → maxRefundable = refund_amount đã tính sẵn lúc khách hủy (hoặc total_deposit_paid)
  // - COMPLETED / PENDING_SETTLEMENT: Khách đã ăn xong, đã thanh toán
  //   → maxRefundable = total_deposit_paid + amount_collected
  // ============================================================
  const alreadyRefunded = booking.status === 'REFUND_COMPLETED' ? (booking.refund_info?.refund_amount || 0) : 0;
  const maxRefundable = booking.status === 'CANCELLED_REFUND_PENDING'
    ? (booking.refund_info?.refund_amount || booking.total_deposit_paid || 0)
    : (booking.total_deposit_paid || 0) + (booking.amount_collected || 0) - alreadyRefunded;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('File ảnh không được vượt quá 5MB');
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const canSubmit = 
    refundAmount && 
    Number(refundAmount) > 0 && 
    Number(refundAmount) <= maxRefundable &&
    reason.trim() && 
    proofFile;

  const handleSubmitRefund = async () => {
    if (!canSubmit || !proofFile) return;

    setIsSubmitting(true);
    try {
      // Step 1: Upload ảnh chứng từ lên Cloudinary
      const proofUrl = await checkInService.uploadRefundProof(proofFile);

      // Step 2: Gọi API processRefund
      await checkInService.processRefund(booking._id, {
        refund_amount: Number(refundAmount),
        reason: `[${REFUND_TYPES.find(t => t.value === refundType)?.label}] ${reason}`,
        refund_proof_url: proofUrl
      });

      success(`Hoàn tiền ${Number(refundAmount).toLocaleString()}đ thành công!`);
      onSuccess();
    } catch (err: any) {
      showError(err.message || 'Lỗi xử lý hoàn tiền');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Undo2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Hoàn Tiền (Refund)</h2>
              <p className="text-red-100 text-sm">{customerName} - Bàn {tableNames}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors hover:bg-white/10 p-1.5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Cảnh báo */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 text-sm">Hành động nhạy cảm tài chính</p>
              <p className="text-red-700 text-xs mt-1">
                Hoàn tiền sẽ được ghi log đầy đủ (Ai, Khi nào, Bao nhiêu). 
                Bắt buộc upload ảnh chứng từ chuyển khoản hoặc phiếu chi. 
                Admin có quyền review tất cả giao dịch hoàn tiền.
              </p>
            </div>
          </div>

          {step === 'FORM' ? (
            <div className="space-y-5">
              {/* Số tiền có thể hoàn */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tiền cọc đã thu:</span>
                  <span className="font-bold">{(booking.total_deposit_paid || 0).toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tiền thu tại quầy:</span>
                  <span className="font-bold">{(booking.amount_collected || 0).toLocaleString()}đ</span>
                </div>
                {alreadyRefunded > 0 && (
                  <div className="flex justify-between text-sm mb-2 text-red-600">
                    <span>Đã hoàn trước đó:</span>
                    <span className="font-bold">-{alreadyRefunded.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 mt-2">
                  <span className="font-bold text-gray-900">Tối đa có thể hoàn:</span>
                  <span className="font-bold text-red-600 text-base">{maxRefundable.toLocaleString()}đ</span>
                </div>
              </div>

              {booking.refund_info?.bank_account_number && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <h3 className="font-bold text-blue-900 mb-3 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Thông tin nhận tiền của khách
                  </h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Ngân hàng:</span>
                      <span className="font-bold">{booking.refund_info.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số tài khoản:</span>
                      <span className="font-bold font-mono">{booking.refund_info.bank_account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chủ tài khoản:</span>
                      <span className="font-bold">{booking.refund_info.account_holder_name}</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-3 italic">
                    * Vui lòng chuyển khoản đúng số tiền hoàn và tải ảnh UNC xác nhận.
                  </p>
                </div>
              )}

              {/* Loại hoàn tiền */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Loại hoàn tiền</label>
                <select 
                  value={refundType}
                  onChange={e => setRefundType(e.target.value)}
                  className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                >
                  {REFUND_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Số tiền hoàn */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Số tiền hoàn (đ) *</label>
                <input 
                  type="number"
                  min="1"
                  max={maxRefundable}
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  placeholder={`Tối đa ${maxRefundable.toLocaleString()}đ`}
                  className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
                {refundAmount && Number(refundAmount) > maxRefundable && (
                  <p className="text-red-500 text-xs mt-1">Vượt quá số tiền có thể hoàn!</p>
                )}
              </div>

              {/* Lý do */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Lý do chi tiết (Bắt buộc) *</label>
                <textarea 
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  placeholder="Mô tả chi tiết lý do hoàn tiền..."
                  className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                />
              </div>

              {/* Upload chứng từ */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Ảnh chứng từ (Bắt buộc) *
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload ảnh UNC chuyển khoản hoặc phiếu chi tiền mặt (max 5MB)
                </p>

                {proofPreview ? (
                  <div className="relative rounded-lg overflow-hidden border-2 border-green-300 bg-green-50">
                    <img src={proofPreview} alt="Chứng từ" className="w-full h-40 object-cover" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        onClick={() => { setProofFile(null); setProofPreview(''); }}
                        className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Đã chọn ảnh
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-red-400 hover:bg-red-50/30 transition-colors cursor-pointer"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-600">Bấm để chọn ảnh chứng từ</span>
                    <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — Tối đa 5MB</span>
                  </button>
                )}

                <input 
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            /* Step CONFIRM */
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="font-bold text-amber-900 mb-3">Xác nhận hoàn tiền</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Khách hàng:</span>
                    <span className="font-bold">{customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loại:</span>
                    <span className="font-bold">{REFUND_TYPES.find(t => t.value === refundType)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số tiền hoàn:</span>
                    <span className="font-bold text-red-600 text-lg">{Number(refundAmount).toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lý do:</span>
                    <span className="font-bold text-right max-w-[200px]">{reason}</span>
                  </div>
                </div>
              </div>

              {proofPreview && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img src={proofPreview} alt="Chứng từ" className="w-full h-32 object-cover" />
                  <p className="text-xs text-center text-gray-500 py-1 bg-gray-50">Ảnh chứng từ đính kèm</p>
                </div>
              )}

              <p className="text-red-700 font-bold text-sm text-center">
                ⚠️ Hành động này KHÔNG THỂ hoàn tác. Số tiền sẽ bị trừ khỏi doanh thu!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          {step === 'FORM' ? (
            <>
              <Button 
                variant="outline" 
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold"
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                onClick={() => setStep('CONFIRM')}
                disabled={!canSubmit}
              >
                Tiếp tục xác nhận
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold"
                onClick={() => setStep('FORM')}
                disabled={isSubmitting}
              >
                ← Quay lại
              </Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                onClick={handleSubmitRefund}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'XÁC NHẬN HOÀN TIỀN'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
