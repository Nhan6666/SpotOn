import React, { useState } from 'react';
import { X, AlertTriangle, Building2, User, FileText, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { profileService } from '../profile.service';
import { useToast } from '@/components/ui/Toast';

interface CancelBookingModalProps {
  booking: any;
  onClose: () => void;
  onConfirm: (payload: { bank_name: string; bank_account_number: string; account_holder_name: string; reason: string; otp?: string }) => void;
  isSubmitting: boolean;
}

export function CancelBookingModal({ booking, onClose, onConfirm, isSubmitting }: CancelBookingModalProps) {
  const [step, setStep] = useState<'CALCULATE' | 'FORM' | 'OTP'>('CALCULATE');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const { error: showError, success: showSuccess } = useToast();
  
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [reason, setReason] = useState('');
  const [otp, setOtp] = useState('');

  const now = new Date();
  const reservationDate = new Date(booking.reservation_date);
  const [hours, minutes] = (booking.arrival_time || '00:00').split(':').map(Number);
  reservationDate.setHours(hours, minutes, 0, 0);

  const timeDiffHours = (reservationDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundPercentage = 0;
  if (timeDiffHours >= 12) {
    refundPercentage = 100;
  } else if (timeDiffHours >= 6) {
    refundPercentage = 50;
  } else {
    refundPercentage = 0;
  }

  const refundAmount = (booking.total_deposit_paid || 0) * (refundPercentage / 100);
  const isRefundable = refundAmount > 0;

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsRequestingOtp(true);
      await profileService.requestCancelOtp(booking._id);
      showSuccess('Mã OTP đã được gửi đến email của bạn');
      setStep('OTP');
    } catch (err: any) {
      showError(err.message || 'Lỗi khi gửi mã OTP');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      showError('Vui lòng nhập mã OTP');
      return;
    }
    onConfirm({
      bank_name: bankName,
      bank_account_number: accountNumber,
      account_holder_name: accountName,
      reason: reason,
      otp: otp
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Xác nhận Hủy Bàn</h2>
              <p className="text-red-100 text-sm">Mã đơn: {booking._id.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors hover:bg-white/10 p-1.5 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 'CALCULATE' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                <h3 className="font-bold text-orange-900 mb-2">Chính sách hủy bàn & Hoàn cọc</h3>
                <ul className="text-sm text-orange-800 space-y-1 list-disc pl-4">
                  <li>Hủy trước <strong>12 tiếng</strong>: Hoàn 100% cọc</li>
                  <li>Hủy từ <strong>6 - 12 tiếng</strong>: Hoàn 50% cọc</li>
                  <li>Hủy dưới <strong>6 tiếng</strong>: Không hoàn cọc</li>
                </ul>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giờ đến dự kiến:</span>
                  <span className="font-bold">{booking.arrival_time} - {new Date(booking.reservation_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thời gian hủy trước:</span>
                  <span className="font-bold text-blue-600">{timeDiffHours.toFixed(1)} tiếng</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiền cọc đã thanh toán:</span>
                  <span className="font-bold">{(booking.total_deposit_paid || 0).toLocaleString()}đ</span>
                </div>
                
                <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Tiền được hoàn lại:</span>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${isRefundable ? 'text-green-600' : 'text-red-600'}`}>
                      {refundAmount.toLocaleString()}đ
                    </span>
                    <p className="text-xs text-gray-500 font-medium">({refundPercentage}%)</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={isRequestingOtp}>Giữ lại bàn</Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => isRefundable ? setStep('FORM') : handleRequestOtp()}
                  disabled={isRequestingOtp}
                >
                  {isRequestingOtp ? 'Đang gửi mã OTP...' : (isRefundable ? 'Tiếp tục điền Form' : 'Nhận mã OTP để Hủy')}
                </Button>
              </div>
            </div>
          )}

          {step === 'FORM' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex gap-3 text-sm text-blue-800 mb-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-blue-600" />
                <p>Bạn sẽ được hoàn <strong>{refundAmount.toLocaleString()}đ</strong>. Vui lòng cung cấp chính xác thông tin tài khoản ngân hàng để chúng tôi chuyển khoản.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-400" /> Ngân hàng *
                </label>
                <input 
                  required
                  type="text"
                  placeholder="VD: Vietcombank, MB Bank, Techcombank..."
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-400" /> Số tài khoản *
                </label>
                <input 
                  required
                  type="text"
                  placeholder="Nhập số tài khoản ngân hàng"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400" /> Tên chủ tài khoản *
                </label>
                <input 
                  required
                  type="text"
                  placeholder="VD: NGUYEN VAN A"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value.toUpperCase())}
                  className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  Lý do hủy bàn
                </label>
                <textarea 
                  rows={2}
                  placeholder="Nhập lý do hủy (tùy chọn)..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('CALCULATE')} disabled={isRequestingOtp}>Quay lại</Button>
                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={isRequestingOtp}>
                  {isRequestingOtp ? 'Đang gửi mã OTP...' : 'Nhận mã OTP & Tiếp tục'}
                </Button>
              </div>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-bold text-green-900 mb-1">Mã OTP đã được gửi!</h3>
                <p className="text-sm text-green-800">Vui lòng kiểm tra email của bạn để lấy mã xác thực gồm 6 chữ số.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-gray-400" /> Nhập mã OTP *
                </label>
                <input 
                  required
                  type="text"
                  maxLength={6}
                  placeholder="Nhập 6 số OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-center text-xl tracking-[0.5em] font-mono font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" className="flex-1" onClick={() => isRefundable ? setStep('FORM') : setStep('CALCULATE')} disabled={isSubmitting}>Quay lại</Button>
                <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting || otp.length < 6}>
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Hủy bàn'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
