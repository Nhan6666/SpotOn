import { Suspense } from 'react';
import { PaymentResultContent } from '@/features/public/booking-result/PaymentResultContent';

export const metadata = {
  title: 'Kết quả thanh toán - SpotOn',
};

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center p-12"><div className="animate-spin h-8 w-8 border-b-2 border-[#ea580c] mx-auto rounded-full"></div></div>}>
        <PaymentResultContent />
      </Suspense>
    </div>
  );
}
