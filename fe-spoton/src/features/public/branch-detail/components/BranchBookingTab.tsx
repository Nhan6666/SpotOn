import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { LoginModal } from '@/features/auth/LoginModal';
import { PublicBranchDetail } from '../branch-detail.types';
import { branchDetailService } from '../branch-detail.service';
import { Calendar, Clock, Users, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { BookingCheckoutStep } from './BookingCheckoutStep';
import { socket } from '@/lib/socket';
import { PUBLIC_TEXTS } from '@/constants/texts/public';

const generateTimeSlots = () => {
  const slots = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  return slots;
};

export function BranchBookingTab({ branch }: { branch: PublicBranchDetail }) {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
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
  const [holdData, setHoldData] = useState<{ id: string; expiresAt: string; branchId: string; selectedTables?: any[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('spoton_draft_booking');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (new Date(parsed.expiresAt) > new Date() && parsed.branchId === branch._id) {
          setHoldData(parsed);
          if (parsed.selectedTables) {
            setSelectedTables(parsed.selectedTables);
          }
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

    // Bắt lỗi không cho đặt bàn trong quá khứ
    const now = new Date();
    // Tạo object Date local từ chuỗi date (YYYY-MM-DD)
    const [year, month, day] = date.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    const [hours, minutes] = time.split(':').map(Number);
    selectedDateObj.setHours(hours, minutes, 0, 0);

    if (selectedDateObj.getTime() < now.getTime()) {
      if (!keepError) setErrorMsg('Không thể đặt bàn vào thời điểm trong quá khứ. Vui lòng chọn ngày giờ hợp lệ.');
      setHasChecked(false);
      return;
    }

    // Bắt lỗi đặt trước ít nhất 2 tiếng
    const diffHours = (selectedDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < 2) {
      if (!keepError) setErrorMsg('Vui lòng đặt bàn trước ít nhất 2 tiếng để nhà hàng chuẩn bị tốt nhất.');
      setHasChecked(false);
      return;
    }

    // Kiểm tra giờ đóng cửa dựa trên service_periods của chi nhánh
    if (branch.service_periods) {
      const { lunch, dinner } = branch.service_periods;
      
      const toMins = (t: string) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      };

      const checkShift = (start: string, end: string, t: string) => {
        if (!start || !end) return false;
        const sMins = toMins(start);
        let eMins = toMins(end);
        let tMins = toMins(t);
        if (eMins < sMins) eMins += 24 * 60; // Qua đêm
        if (tMins < sMins && eMins > 24 * 60) tMins += 24 * 60; // Thời gian t nằm ở rạng sáng hsau
        return { isIn: tMins >= sMins && tMins <= eMins, tMins, sMins };
      };

      const lunchShift = checkShift(lunch?.start, lunch?.end, time);
      const dinnerShift = checkShift(dinner?.start, dinner?.end, time);

      const inLunch = lunchShift.isIn;
      const inDinner = dinnerShift.isIn;

      if (!inLunch && !inDinner) {
        if (!keepError) setErrorMsg(`Nhà hàng chỉ mở cửa ca Trưa (${lunch.start}-${lunch.end}) và ca Tối (${dinner.start}-${dinner.end}).`);
        setHasChecked(false);
        return;
      }

      // Kiểm tra last_booking
      if (inLunch && lunch.last_booking) {
        let lMins = toMins(lunch.last_booking);
        if (lMins < lunchShift.sMins) lMins += 24 * 60;
        if (lunchShift.tMins > lMins) {
          if (!keepError) setErrorMsg(`Ca trưa chỉ nhận đặt bàn muộn nhất đến ${lunch.last_booking}. Vui lòng chọn giờ sớm hơn.`);
          setHasChecked(false);
          return;
        }
      }

      if (inDinner && dinner.last_booking) {
        let lMins = toMins(dinner.last_booking);
        if (lMins < dinnerShift.sMins) lMins += 24 * 60;
        if (dinnerShift.tMins > lMins) {
          if (!keepError) setErrorMsg(`Ca tối chỉ nhận đặt bàn muộn nhất đến ${dinner.last_booking}. Vui lòng chọn giờ sớm hơn.`);
          setHasChecked(false);
          return;
        }
      }
    }

    setIsChecking(true);
    setSelectedTables([]); // Reset selection when checking again
    try {
      const res = await branchDetailService.checkAvailability(branch._id, date, time);
      if (res.success) {
        const booked = res.data.booked_table_ids || [];
        
        // --- CHỐT CHẶN 1: Kiểm tra tổng sức chứa trống ---
        const totalAvailableCapacity = branch.zones?.reduce((total: number, zone: any) => {
          if (zone.status !== 'OPEN') return total;
          const availableTablesInZone = zone.tables.filter((t: any) => !booked.includes(t._id));
          const zoneCapacity = availableTablesInZone.reduce((sum: number, t: any) => sum + t.capacity, 0);
          return total + zoneCapacity;
        }, 0) || 0;

        if (totalAvailableCapacity < guestCount) {
          if (!keepError) setErrorMsg(`Rất tiếc, nhà hàng hiện không còn đủ bàn trống để phục vụ ${guestCount} khách vào lúc ${time}.`);
          setHasChecked(false);
          return;
        }

        setBookedTableIds(booked);
        setHasChecked(true);
      } else {
        if (!keepError) setErrorMsg(res.message || 'Lỗi kiểm tra bàn trống.');
        setHasChecked(false);
      }
    } catch (err: any) {
      if (!keepError) setErrorMsg(err.message || 'Có lỗi xảy ra khi kiểm tra bàn.');
      setHasChecked(false);
    } finally {
      setIsChecking(false);
    }
  }, [branch._id, date, time, guestCount]);

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
        alert(PUBLIC_TEXTS.branchDetail.bookingTab.limitAlert);
        return;
      }
      setSelectedTables(prev => [...prev, table]);
    }
  };

  const totalCapacity = selectedTables.reduce((sum, table) => sum + table.capacity, 0);

  const handleHoldBooking = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (selectedTables.length === 0) return;

    // --- CHỐT CHẶN 2: Bắt lỗi bàn quá nhỏ (dung sai cho phép ghép thêm tối đa 2 ghế) ---
    if (totalCapacity + 2 < guestCount) {
      setErrorMsg(`Bàn bạn chọn (chứa ${totalCapacity} người) quá nhỏ so với số lượng khách (${guestCount}). Vui lòng chọn thêm bàn!`);
      return;
    }

    if (totalCapacity < guestCount) {
      const msg = PUBLIC_TEXTS.branchDetail.bookingTab.capacityAlert
        .replace('{capacity}', String(totalCapacity))
        .replace('{guests}', String(guestCount));
      const confirmProceed = window.confirm(msg);
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
          branchId: branch._id,
          selectedTables
        };
        setHoldData(newData);
        localStorage.setItem('spoton_draft_booking', JSON.stringify(newData));
      } else {
        setErrorMsg(res.message || 'Không thể giữ bàn lúc này.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi giữ bàn.');
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
        selectedTables={holdData.selectedTables || selectedTables}
        onCancel={async () => { 
          if (holdData?.id) {
            await branchDetailService.releaseBooking(holdData.id);
          }
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
        <h3 className="text-xl font-bold text-gray-900 mb-2">{PUBLIC_TEXTS.branchDetail.bookingTab.step1}</h3>
        <p className="text-gray-500 text-sm mb-4">{PUBLIC_TEXTS.branchDetail.bookingTab.step1Desc}</p>
        
        <div className="bg-white rounded-2xl md:rounded-full shadow-sm p-2 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-gray-100 border border-gray-200">
          <div className="relative flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-[#ea580c] flex-shrink-0" />
            <div className="ml-3 flex flex-col flex-1 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide">{PUBLIC_TEXTS.branchDetail.bookingTab.date}</span>
              <input 
                type="date" 
                value={date}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={e => {
                  setDate(e.target.value);
                  setHasChecked(false);
                }}
                className="w-full bg-transparent border-none p-0 outline-none text-gray-600 font-medium text-sm md:text-base focus:ring-0 mt-0.5 cursor-pointer"
              />
            </div>
          </div>
          <div className="relative flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-[#ea580c] flex-shrink-0" />
            <div className="ml-3 flex flex-col flex-1 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide">{PUBLIC_TEXTS.branchDetail.bookingTab.time}</span>
              <select 
                value={time}
                onChange={e => {
                  setTime(e.target.value);
                  setHasChecked(false);
                }}
                className="w-full bg-transparent border-none p-0 outline-none text-gray-600 font-medium text-sm md:text-base focus:ring-0 mt-0.5 cursor-pointer appearance-none"
              >
                {generateTimeSlots().map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="relative flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-[#ea580c] flex-shrink-0" />
            <div className="ml-3 flex flex-col flex-1 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide">{PUBLIC_TEXTS.branchDetail.bookingTab.guests}</span>
              <input 
                type="number" 
                min="1"
                max="20"
                value={guestCount}
                onChange={e => {
                  setGuestCount(Number(e.target.value));
                  setHasChecked(false);
                }}
                className="w-full bg-transparent border-none p-0 outline-none text-gray-600 font-medium text-sm md:text-base focus:ring-0 mt-0.5 cursor-pointer"
              />
            </div>
          </div>
          <div className="p-1.5 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
            <button 
              onClick={() => handleCheckAvailability(false)}
              disabled={isChecking}
              className="w-full md:w-auto px-8 py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-full transition-colors flex items-center justify-center shadow-md disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              {isChecking ? PUBLIC_TEXTS.branchDetail.bookingTab.checkingBtn : PUBLIC_TEXTS.branchDetail.bookingTab.checkBtn}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{PUBLIC_TEXTS.branchDetail.bookingTab.step2}</h3>
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> 
                Hệ thống cho phép chọn bàn nhỏ hơn số khách thực tế tối đa 2 người (để kê thêm ghế phụ).
              </p>
            </div>
            <div className="text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 self-start sm:self-auto">
              {PUBLIC_TEXTS.branchDetail.bookingTab.selectedCount} <strong className="text-[#ea580c]">{selectedTables.length}</strong> / {PUBLIC_TEXTS.branchDetail.bookingTab.capacity} <strong className={totalCapacity < guestCount ? "text-red-500" : "text-emerald-600"}>{totalCapacity}</strong>
            </div>
          </div>

          {!branch.zones || branch.zones.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center">
              <p className="text-gray-500 italic">{PUBLIC_TEXTS.branchDetail.bookingTab.noZone}</p>
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
                    <span className="text-gray-600 font-medium">{PUBLIC_TEXTS.branchDetail.bookingTab.tableStatus.available}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#ea580c] border border-[#c2410c] rounded"></div>
                    <span className="text-gray-600 font-medium">{PUBLIC_TEXTS.branchDetail.bookingTab.tableStatus.selected}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
                    <span className="text-gray-600 font-medium">{PUBLIC_TEXTS.branchDetail.bookingTab.tableStatus.booked}</span>
                  </div>
                </div>

                <button 
                  onClick={handleHoldBooking}
                  disabled={selectedTables.length === 0 || isHolding}
                  className="w-full md:w-auto px-8 py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isHolding ? PUBLIC_TEXTS.branchDetail.bookingTab.holdingBtn : PUBLIC_TEXTS.branchDetail.bookingTab.holdBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
        }}
      />
    </div>
  );
}
