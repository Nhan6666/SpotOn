import { MyBookings } from '@/features/profile/components/MyBookings';
import { Navbar } from '@/components/ui/Navbar';
import { Footer } from '@/components/ui/Footer';
import { Calendar } from 'lucide-react';

export const metadata = {
  title: 'Lịch sử đặt bàn | SpotOn',
  description: 'Xem lại lịch sử đặt bàn và giao dịch của bạn',
};

export default function MyBookingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-100 p-3 rounded-2xl">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lịch sử đặt bàn & giao dịch</h1>
              <p className="text-gray-500 text-sm mt-1">Quản lý các đơn đặt bàn và theo dõi trạng thái hoàn tiền của bạn.</p>
            </div>
          </div>
          <MyBookings />
        </div>
      </main>
      <Footer />
    </div>
  );
}
