"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { HOME_TEXTS } from '@/constants/texts/home';
import { useToast } from '@/components/ui/Toast';

const CAN_THO_LOCATIONS = [
  "Quận Ninh Kiều, Cần Thơ",
  "Quận Bình Thủy, Cần Thơ",
  "Quận Cái Răng, Cần Thơ",
  "Quận Ô Môn, Cần Thơ",
  "Quận Thốt Nốt, Cần Thơ",
  "Huyện Phong Điền, Cần Thơ",
  "Huyện Cờ Đỏ, Cần Thơ",
  "Huyện Thới Lai, Cần Thơ",
  "Huyện Vĩnh Thạnh, Cần Thơ",
];

export function HeroSection() {
  const { error: showError } = useToast();
  const [location, setLocation] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const timeRef = useRef<HTMLDivElement>(null);
  const [guestCount, setGuestCount] = useState<number | null>(null);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const guestsRef = useRef<HTMLDivElement>(null);

  const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '10+'];


  
  const TIME_OPTIONS = [
    "09:00", "09:15", "09:30", "09:45", 
    "10:00", "10:15", "10:30", "10:45",
    "11:00", "11:15", "11:30", "11:45", 
    "12:00", "12:15", "12:30", "12:45",
    "13:00", "13:15", "13:30", "13:45", 
    "14:00", "14:15", "14:30", "14:45",
    "15:00", "15:15", "15:30", "15:45", 
    "16:00", "16:15", "16:30", "16:45",
    "17:00", "17:15", "17:30", "17:45", 
    "18:00", "18:15", "18:30", "18:45",
    "19:00", "19:15", "19:30", "19:45", 
    "20:00", "20:15", "20:30", "20:45",
    "21:00", "21:15", "21:30", "21:45", 
    "22:00"
  ];

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9:]/g, ''); // Chỉ cho phép số và dấu :
    
    // Tự động thêm dấu : nếu nhập 3 hoặc 4 số (vd 103 -> 10:3, 1030 -> 10:30)
    if (val.length === 3 && !val.includes(':')) {
      val = val.substring(0, 2) + ':' + val.substring(2);
    } else if (val.length === 4 && !val.includes(':')) {
      val = val.substring(0, 2) + ':' + val.substring(2);
    }
    
    if (val.length <= 5) setTime(val);
  };

  const handleTimeBlur = () => {
    if (!time) return;
    
    // Validate đúng format HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(time)) {
      // Thử chuẩn hóa (VD: 9:30 -> 09:30, 8:00 -> 08:00)
      const parts = time.split(':');
      if (parts.length === 2) {
        const h = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          setTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
          return;
        }
      }
      // Nếu nhập sai hoàn toàn thì xóa
      setTime('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (timeRef.current && !timeRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        setShowGuestsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLocations = CAN_THO_LOCATIONS.filter(loc => 
    loc.toLowerCase().includes(location.toLowerCase())
  );

  return (
    <section className="relative w-full h-[600px] mb-24 bg-[#164626] flex items-center justify-center">

      <div className="relative z-10 flex flex-col items-center justify-center pt-10 pb-32 px-4 container mx-auto h-full text-center">
        {/* Title Block */}
        <h1 className="text-6xl md:text-8xl font-stencil text-[#F2B02A] mb-4 tracking-wide leading-tight uppercase" dangerouslySetInnerHTML={{ __html: HOME_TEXTS.hero.title.replace('TRONG', 'TRONG<br />') }}>
        </h1>
        <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
            {HOME_TEXTS.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/branches" className="px-8 py-3 bg-[#F2B02A] hover:bg-[#d99d24] text-[#164626] font-bold uppercase tracking-wider rounded-full transition-colors shadow-md cursor-pointer block">
              {HOME_TEXTS.hero.bookingBtn}
            </Link>
            <Link href="/menu" className="px-8 py-3 bg-transparent hover:bg-[#113a1e] text-[#F2B02A] font-bold uppercase tracking-wider rounded-full transition-colors shadow-sm border border-[#F2B02A] cursor-pointer block">
              {HOME_TEXTS.hero.menuBtn}
            </Link>
          </div>
      </div>

      {/* Search/Filter Bar */}
      <div className="absolute left-0 right-0 z-20 flex justify-center -bottom-10 px-4">
        <div className="bg-[#0A2A12] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-2 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-[#2A5A3A] border border-[#2A5A3A] animate-fadeInUp delay-100 max-w-5xl w-full">
          
          {/* LOCATION */}
          <div ref={locationRef} className="relative flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-[#113a1e] rounded-full transition-colors cursor-pointer group">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#F2B02A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <div className="ml-3 flex flex-col flex-1 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold text-[#F2B02A] uppercase tracking-wide">{HOME_TEXTS.hero.location.label}</span>
              <input 
                type="text" 
                placeholder={HOME_TEXTS.hero.location.placeholder}
                className="w-full bg-transparent outline-none text-white font-medium text-sm md:text-base placeholder-gray-400 group-hover:placeholder-gray-300 truncate mt-0.5"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowLocationDropdown(true);
                }}
                onFocus={() => setShowLocationDropdown(true)}
              />
            </div>

            {/* Dropdown for Locations */}
            {showLocationDropdown && (
              <div className="absolute top-[110%] left-0 w-full md:w-[150%] bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {HOME_TEXTS.hero.location.dropdownHeader}
                </div>
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc, index) => (
                    <div 
                      key={index}
                      className="px-4 py-2.5 hover:bg-amber-50 cursor-pointer flex items-center gap-3 transition-colors"
                      onClick={() => {
                        setLocation(loc);
                        setShowLocationDropdown(false);
                      }}
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                      <span className="text-sm font-medium text-gray-700">{loc}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {HOME_TEXTS.hero.location.notFound}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* DATE */}
          <div className="flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-[#113a1e] rounded-full transition-colors cursor-pointer group">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#F2B02A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <div className="ml-3 flex flex-col flex-1 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold text-[#F2B02A] uppercase tracking-wide">{HOME_TEXTS.hero.date.label}</span>
              <DatePicker
                selected={date}
                onChange={(d: Date | null) => setDate(d)}
                dateFormat="dd/MM/yyyy"
                placeholderText={HOME_TEXTS.hero.date.placeholder}
                minDate={new Date()}
                className="w-full bg-transparent outline-none text-white font-medium text-sm md:text-base placeholder-gray-400 group-hover:placeholder-gray-300 truncate mt-0.5 cursor-pointer custom-datepicker-input"
                wrapperClassName="w-full"
                popperClassName="spoton-datepicker-popper"
              />
            </div>
          </div>

          {/* TIME */}
          <div ref={timeRef} className="relative flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-[#113a1e] rounded-full transition-colors cursor-pointer group">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#F2B02A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div className="ml-3 flex flex-col flex-1 overflow-hidden cursor-pointer" onClick={() => setShowTimeDropdown(true)}>
              <span className="text-[10px] md:text-xs font-bold text-[#F2B02A] uppercase tracking-wide cursor-pointer">{HOME_TEXTS.hero.time.label}</span>
              <input 
                type="text" 
                placeholder={HOME_TEXTS.hero.time.placeholder}
                value={time}
                onChange={handleTimeChange}
                onBlur={handleTimeBlur}
                className="w-full bg-transparent outline-none text-white font-medium text-sm md:text-base placeholder-gray-400 group-hover:placeholder-gray-300 truncate mt-0.5 cursor-pointer" 
              />
            </div>

            {/* Dropdown for Time */}
            {showTimeDropdown && (
              <div className="absolute top-[110%] left-0 w-full md:w-[150%] bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {HOME_TEXTS.hero.time.dropdownHeader}
                </div>
                <div className="grid grid-cols-3 gap-1 px-2">
                  {TIME_OPTIONS.map((t, index) => (
                    <div 
                      key={index}
                      className="px-2 py-2 text-center hover:bg-amber-50 cursor-pointer rounded-lg transition-colors text-sm font-medium text-gray-700 hover:text-[#ef5914]"
                      onClick={() => {
                        setTime(t);
                        setShowTimeDropdown(false);
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GUESTS */}
          <div ref={guestsRef} className="relative flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-[#113a1e] rounded-full transition-colors cursor-pointer group">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#F2B02A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <div className="ml-3 flex flex-col flex-1 overflow-hidden cursor-pointer" onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}>
              <span className="text-[10px] md:text-xs font-bold text-[#F2B02A] uppercase tracking-wide cursor-pointer">{HOME_TEXTS.hero.guests.label}</span>
              <input 
                type="text" 
                readOnly
                placeholder={HOME_TEXTS.hero.guests.placeholder}
                value={guestCount ? `${guestCount} Khách` : ''} 
                className="w-full bg-transparent outline-none text-white font-medium text-sm md:text-base placeholder-gray-400 group-hover:placeholder-gray-300 truncate mt-0.5 cursor-pointer" 
              />
            </div>

            {/* Dropdown for Guests */}
            {showGuestsDropdown && (
              <div className="absolute top-[110%] right-0 w-full md:w-[150%] bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {HOME_TEXTS.hero.guests.dropdownHeader}
                </div>
                {GUEST_OPTIONS.map((num, index) => (
                  <div 
                    key={index}
                    className="px-4 py-2.5 hover:bg-amber-50 cursor-pointer flex items-center gap-3 transition-colors"
                    onClick={() => {
                      setGuestCount(num === '10+' ? 10 : (num as number));
                      setShowGuestsDropdown(false);
                    }}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    <span className="text-sm font-medium text-gray-700">{num} Khách</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEARCH BUTTON */}
          <div className="p-1.5 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
            <button 
              onClick={() => {
                // Validation Date & Time
                if (date && time) {
                  const now = new Date();
                  const [hours, minutes] = time.split(':').map(Number);
                  const selectedDateObj = new Date(date);
                  selectedDateObj.setHours(hours, minutes, 0, 0);

                  if (selectedDateObj.getTime() < now.getTime()) {
                    showError('Không thể chọn thời gian trong quá khứ. Vui lòng chọn lại ngày giờ đến.');
                    return;
                  }

                  const diffHours = (selectedDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);
                  if (diffHours < 2) {
                    showError('Vui lòng đặt bàn trước ít nhất 2 tiếng để nhà hàng chuẩn bị tốt nhất.');
                    return;
                  }
                }

                // Format location to just the district name for the filter
                let districtParam = "Tất cả quận";
                if (location) {
                  const parts = location.split(',');
                  districtParam = parts[0].replace('Quận ', '').replace('Huyện ', '').trim();
                }
                const dateString = date ? date.toLocaleDateString('en-CA') : ''; // yyyy-mm-dd
                window.location.href = `/branches?district=${encodeURIComponent(districtParam)}&date=${dateString}&time=${time}&guests=${guestCount || ''}`;
              }}
              className="w-full md:w-auto px-8 py-3.5 bg-[#F2B02A] hover:bg-[#d99d24] text-[#164626] font-bold uppercase tracking-wider rounded-full transition-colors flex items-center justify-center shadow-md cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              {HOME_TEXTS.hero.searchBtn}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
