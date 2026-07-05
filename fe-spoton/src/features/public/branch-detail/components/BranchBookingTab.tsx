import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicBranchDetail } from '../branch-detail.types';
import { branchDetailService } from '../branch-detail.service';
import { Calendar, Clock, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BookingCheckoutStep } from './BookingCheckoutStep';
import { socket } from '@/lib/socket';

export function BranchBookingTab({ branch }: { branch: PublicBranchDetail }) {
  const searchParams = useSearchParams();
  const urlDate = searchParams.get('date');
  const urlTime = searchParams.get('time');
  const urlGuests = searchParams.get('guests');

  const [selectedZone, setSelectedZone] = useState<string | null>(branch.zones?.[0]?._id || null);
  
  // Search Form State
  const [date, setDate] = useState(urlDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(urlTime || '19:00');
  const [guestCount, setGuestCount] = useState(Number(urlGuests) || 2);
  
  // Booking State
  const [isChecking, setIsChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [bookedTableIds, setBookedTableIds] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<any[]>([]);
  
  // Flow State
  const [isHolding, setIsHolding] = useState(false);
  const [holdData, setHoldData] = useState<{ id: string; expiresAt: string; branchId: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('spoton_draft_booking');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (new Date(parsed.expiresAt) > new Date() && parsed.branchId === branch._id) {
          setHoldData(parsed);
        } else {
          localStorage.removeItem('spoton_draft_booking');
        }
      } catch (e) {
        localStorage.removeItem('spoton_draft_booking');
      }
    }
  }, [branch._id]);

  const currentZone = branch.zones?.find(z => z._id === selectedZone) || branch.zones?.[0];

  const handleCheckAvailability = useCallback(async (keepError = false) => {
    if (!keepError) setErrorMsg('');
    setIsChecking(true);
    setSelectedTables([]); // Reset selection when checking again
    try {
      const res = await branchDetailService.checkAvailability(branch._id, date, time);
      if (res.success) {
        setBookedTableIds(res.data.booked_table_ids || []);
        setHasChecked(true);
      } else {
        if (!keepError) setErrorMsg(res.message || 'Lỗi kiểm tra bàn trống.');
        setHasChecked(false);
      }
    } catch (err: any) {
      if (!keepError) setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi kiểm tra bàn.');
      setHasChecked(false);
    } finally {
      setIsChecking(false);
    }
  }, [branch._id, date, time]);

  // Real-time Socket.io Sync
  useEffect(() => {
    socket.connect();
    socket.emit('join_branch_room', branch._id);

    const onTableStatusChanged = (data: any) => {
      console.log('Real-time event:', data);
      // Khi có ai đó thay đổi trạng thái bàn, ta gọi lại API để tự refresh sơ đồ
      if (hasChecked) {
        handleCheckAvailability(true); // reload background, keep error
      }
    };

    socket.on('table_status_changed', onTableStatusChanged);

    return () => {
      socket.off('table_status_changed', onTableStatusChanged);
      socket.disconnect();
    };
  }, [branch._id, hasChecked, handleCheckAvailability]);

  useEffect(() => {
    if (urlDate && urlTime && urlGuests) {
      // Small timeout to allow state to settle
      const t = setTimeout(() => {
        handleCheckAvailability();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [urlDate, urlTime, urlGuests, handleCheckAvailability]);

  const toggleTableSelection = (table: any) => {
    if (bookedTableIds.includes(table._id)) return; // Bàn đã bị đặt

    const isSelected = selectedTables.some(t => t._id === table._id);
    if (isSelected) {
      setSelectedTables(prev => prev.filter(t => t._id !== table._id));
    } else {
      if (selectedTables.length >= 4) {
        alert('Chỉ được chọn tối đa 4 bàn. Nếu bạn đi nhóm đông, vui lòng gọi Hotline.');
        return;
      }
      setSelectedTables(prev => [...prev, table]);
    }
  };

  const totalCapacity = selectedTables.reduce((sum, table) => sum + table.capacity, 0);

  const handleHoldBooking = async () => {
    if (selectedTables.length === 0) return;
    if (totalCapacity < guestCount) {
      const confirmProceed = window.confirm(`Cảnh báo: Bàn bạn chọn chỉ chứa được ${totalCapacity} người, nhưng bạn đi ${guestCount} người. Sẽ rất chật chội. Bạn có chắc chắn muốn tiếp tục?`);
      if (!confirmProceed) return;
    }

    setIsHolding(true);
    setErrorMsg('');
    try {
      const res = await branchDetailService.holdBooking({
        branch_id: branch._id,
        date,
        time,
        guest_count: guestCount,
        table_ids: selectedTables.map(t => t._id)
      });

      if (res.success) {
        const newData = {
          id: res.data._id,
          expiresAt: res.data.expires_at,
          branchId: branch._id
        };
        setHoldData(newData);
        localStorage.setItem('spoton_draft_booking', JSON.stringify(newData));
      } else {
        setErrorMsg(res.message || 'Không thể giữ bàn lúc này.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi giữ bàn.');
      // Nếu lỗi 409 (Ai đó vừa đặt), ta nên gọi lại checkAvailability
      handleCheckAvailability(true);
    } finally {
      setIsHolding(false);
    }
  };

  if (holdData) {
    return (
      <BookingCheckoutStep 
        branch={branch}
        bookingId={holdData.id}
        expiresAt={holdData.expiresAt}
        onCancel={() => { 
          setHoldData(null); 
          setHasChecked(false); 
          setSelectedTables([]);
          localStorage.removeItem('spoton_draft_booking');
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">1. Chọn thời gian & số người</h3>
        <p className="text-gray-500 text-sm mb-4">Vui lòng chọn thông tin để hệ thống tìm bàn trống phù hợp.</p>
        
        <div className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar className="w-4 h-4"/> Ngày đến</label>
            <input 
              type="date" 
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Clock className="w-4 h-4"/> Giờ đến</label>
            <input 
              type="time" 
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Users className="w-4 h-4"/> Số khách</label>
            <input 
              type="number" 
              min="1"
              max="20"
              value={guestCount}
              onChange={e => setGuestCount(Number(e.target.value))}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-[#ea580c] focus:border-[#ea580c]"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleCheckAvailability}
              disabled={isChecking}
              className="w-full md:w-auto px-6 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isChecking ? 'Đang kiểm tra...' : 'Tìm bàn trống'}
            </button>
          </div>
        </div>
        
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}
      </div>

      {hasChecked && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">2. Chọn sơ đồ bàn</h3>
            <div className="text-sm">
              Đã chọn: <strong className="text-[#ea580c]">{selectedTables.length} bàn</strong> / Sức chứa: <strong className={totalCapacity < guestCount ? "text-red-500" : "text-emerald-600"}>{totalCapacity} người</strong>
            </div>
          </div>

          {!branch.zones || branch.zones.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center">
              <p className="text-gray-500 italic">Chi nhánh này chưa có sơ đồ bàn.</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
                {branch.zones.map(zone => (
                  <button
                    key={zone._id}
                    onClick={() => setSelectedZone(zone._id)}
                    className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
                      selectedZone === zone._id 
                        ? 'bg-white text-[#ea580c] border-b-2 border-[#ea580c]' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {zone.name} ({zone.tables?.length || 0} bàn)
                  </button>
                ))}
              </div>

              <div className="p-6 bg-gray-100 min-h-[400px] overflow-auto relative">
                {currentZone && currentZone.tables && currentZone.tables.length > 0 ? (
                  <div 
                    className="relative bg-white border-2 border-dashed border-gray-300 mx-auto"
                    style={{ width: '800px', height: '600px' }}
                  >
                    {currentZone.tables.map(table => {
                      const isBooked = bookedTableIds.includes(table._id);
                      const isSelected = selectedTables.some(t => t._id === table._id);
                      
                      let tableClass = "bg-emerald-50 border-emerald-200 hover:border-emerald-500 cursor-pointer text-emerald-900"; // Trống
                      if (isBooked) {
                        tableClass = "bg-gray-200 border-gray-300 cursor-not-allowed opacity-60 text-gray-500"; // Bận
                      } else if (isSelected) {
                        tableClass = "bg-[#ea580c] border-[#c2410c] text-white shadow-lg ring-4 ring-orange-200"; // Đang chọn
                      }

                      return (
                        <div
                          key={table._id}
                          onClick={() => !isBooked && toggleTableSelection(table)}
                          className={`absolute border-2 shadow-sm flex flex-col items-center justify-center transition-all duration-200
                            ${table.shape === 'round' ? 'rounded-full' : 'rounded-md'}
                            ${tableClass}
                          `}
                          style={{
                            left: `${table.x}px`,
                            top: `${table.y}px`,
                            width: `${table.width}px`,
                            height: `${table.height}px`,
                          }}
                          title={`Bàn ${table.table_number} - Sức chứa: ${table.capacity} người ${isBooked ? '(Đã có người đặt)' : ''}`}
                        >
                          <span className="font-bold text-sm">{table.table_number}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-orange-100' : (isBooked ? 'text-gray-400' : 'text-emerald-600')}`}>{table.capacity} chỗ</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-[400px] items-center justify-center">
                    <p className="text-gray-500 italic">Khu vực này chưa có bàn nào được thiết lập.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-white border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-50 border border-emerald-200 rounded"></div>
                    <span className="text-gray-600 font-medium">Trống</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#ea580c] border border-[#c2410c] rounded"></div>
                    <span className="text-gray-600 font-medium">Đang chọn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
                    <span className="text-gray-600 font-medium">Đã bận</span>
                  </div>
                </div>

                <button 
                  onClick={handleHoldBooking}
                  disabled={selectedTables.length === 0 || isHolding}
                  className="w-full md:w-auto px-8 py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isHolding ? 'Đang giữ bàn...' : 'Xác nhận & Tiếp tục'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
