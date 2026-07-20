import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface BookingSearchFormProps {
  initialDate?: string;
  initialTime?: string;
  initialGuests?: number;
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export function BookingSearchForm({ 
  initialDate, 
  initialTime, 
  initialGuests, 
  layout = 'horizontal',
  className = ''
}: BookingSearchFormProps) {
  const router = useRouter();
  const { error: showError } = useToast();
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialTime || '19:00');
  const [guests, setGuests] = useState(initialGuests || 2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const selectedDate = new Date(year, month - 1, day, hours, minutes);

    if (selectedDate.getTime() < now.getTime()) {
      showError('Không thể chọn thời gian trong quá khứ. Vui lòng chọn lại.');
      return;
    }

    const diffHours = (selectedDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 2) {
      showError('Vui lòng đặt bàn trước ít nhất 2 tiếng để nhà hàng chuẩn bị tốt nhất.');
      return;
    }

    router.push(`/branches?date=${date}&time=${time}&guests=${guests}`);
  };

  const isVertical = layout === 'vertical';

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex ${isVertical ? 'flex-col gap-4' : 'flex-col md:flex-row gap-4 items-end'} ${className}`}
    >
      <div className={`flex-1 ${isVertical ? 'w-full' : ''}`}>
        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
          <Calendar className="w-4 h-4 text-[#ea580c]"/> Ngày đến
        </label>
        <input 
          type="date" 
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c] py-2.5 px-3"
          required
        />
      </div>
      
      <div className={`flex-1 ${isVertical ? 'w-full' : ''}`}>
        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
          <Clock className="w-4 h-4 text-[#ea580c]"/> Giờ đến
        </label>
        <input 
          type="time" 
          value={time}
          onChange={e => setTime(e.target.value)}
          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c] py-2.5 px-3"
          required
        />
      </div>
      
      <div className={`flex-1 ${isVertical ? 'w-full' : ''}`}>
        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
          <Users className="w-4 h-4 text-[#ea580c]"/> Số khách
        </label>
        <input 
          type="number" 
          min="1"
          max="20"
          value={guests}
          onChange={e => setGuests(Number(e.target.value))}
          className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c] py-2.5 px-3"
          required
        />
      </div>
      
      <div className={`${isVertical ? 'w-full mt-2' : ''}`}>
        <button 
          type="submit"
          className="w-full md:w-auto px-8 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-lg transition-colors shadow-md text-base"
        >
          Tìm Bàn Trống
        </button>
      </div>
    </form>
  );
}
