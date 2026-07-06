"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useBranches } from "./useBranches";
import { FALLBACK_IMAGES, STATUS_MAP } from "./branches.constants";
import { PublicBranch } from "./branches.types";

export function BranchesFeature() {
  const searchParams = useSearchParams();
  const { branches, isLoading, error } = useBranches();

  const [filterDistrict, setFilterDistrict] = useState("Tất cả quận");
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [filterGuests, setFilterGuests] = useState(0);
  const [filterTime, setFilterTime] = useState("");
  
  const [amenityList, setAmenityList] = useState<any[]>([]);
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);
  
  // Draft states for UI
  const [draftDistrict, setDraftDistrict] = useState("Tất cả quận");
  const [draftStatus, setDraftStatus] = useState("Tất cả");
  const [draftGuests, setDraftGuests] = useState(0);
  const [draftAmenities, setDraftAmenities] = useState<string[]>([]);

  const [showAllAmenities, setShowAllAmenities] = useState(false);

  useEffect(() => {
    const d = searchParams.get("district");
    if (d) { setFilterDistrict(d); setDraftDistrict(d); }

    const g = searchParams.get("guests");
    if (g) { setFilterGuests(parseInt(g, 10) || 0); setDraftGuests(parseInt(g, 10) || 0); }
    
    const t = searchParams.get("time");
    if (t) setFilterTime(t);
    
    // Fetch amenities list
    fetch('/api/v1/amenities')
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setAmenityList(result.data);
        }
      })
      .catch(err => console.error('Failed to fetch amenities:', err));
  }, [searchParams]);

  // Helper: get address string
  const getAddressDisplay = (branch: PublicBranch) => {
    if (typeof branch.address === "object" && branch.address?.full) {
      return branch.address.full;
    }
    if (typeof branch.address === "string") return branch.address;
    return "Chưa cập nhật địa chỉ";
  };

  // Helper: get district display
  const getDistrictDisplay = (branch: PublicBranch) => {
    if (typeof branch.address === "object" && branch.address?.district) {
      return `${branch.address.district}, ${branch.address.city || "Cần Thơ"}`;
    }
    return "Cần Thơ";
  };

  // Helper: format time range
  const getServiceHoursDisplay = (branch: PublicBranch) => {
    const sp = branch.service_periods;
    if (!sp) return null;

    const parts: string[] = [];
    if (sp.lunch?.start && sp.lunch?.end) {
      parts.push(`Trưa: ${sp.lunch.start} – ${sp.lunch.end}`);
    }
    if (sp.dinner?.start && sp.dinner?.end) {
      parts.push(`Tối: ${sp.dinner.start} – ${sp.dinner.end}`);
    }
    return parts.length > 0 ? parts : null;
  };

  // Helper: get branch image
  const getBranchImage = (branch: PublicBranch, index: number) => {
    if (branch.images && branch.images.length > 0) {
      return branch.images[0];
    }
    return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  };

  // Helper: total capacity from zones
  const getTotalCapacity = (branch: PublicBranch) => {
    if (!branch.zones || branch.zones.length === 0) return null;
    const total = branch.zones.reduce((sum, zone) => {
      const zoneCap =
        zone.tables?.reduce((tSum, t) => tSum + (t.capacity || 0), 0) || 0;
      return sum + zoneCap;
    }, 0);
    return total > 0 ? total : null;
  };

  const filteredBranches = useMemo(() => {
    if (!branches) return [];
    return branches.filter((branch) => {
      // Location / District Filter
      if (filterDistrict && filterDistrict !== "Tất cả quận") {
        const district = getDistrictDisplay(branch).toLowerCase();
        if (!district.includes(filterDistrict.toLowerCase())) return false;
      }
      // Status Filter
      if (filterStatus && filterStatus !== "Tất cả") {
        if (filterStatus === "Đang mở" && branch.status !== "OPEN")
          return false;
        if (filterStatus === "Đã đầy" && branch.status !== "FULL") return false;
        if (
          filterStatus === "Đã đóng" &&
          branch.status !== "CLOSED" &&
          branch.status !== "MAINTENANCE"
        )
          return false;
      }
      // Guests Filter
      if (filterGuests > 0) {
        const capacity = getTotalCapacity(branch) || 0;
        if (capacity < filterGuests) return false;
      }
      
      // Time Filter (Service Periods)
      if (filterTime) {
        let isWithinServiceHours = false;
        const sp = branch.service_periods;
        
        if (sp) {
          const checkPeriod = (period?: {start: string, end: string}) => {
            if (!period || !period.start || !period.end) return false;
            return filterTime >= period.start && filterTime <= period.end;
          };
          
          if (checkPeriod(sp.lunch) || checkPeriod(sp.dinner)) {
            isWithinServiceHours = true;
          }
        }
        
        // Nếu chi nhánh có khai báo giờ phục vụ và giờ khách chọn không nằm trong khung giờ đó, thì ẩn đi
        if (sp && (sp.lunch?.start || sp.dinner?.start) && !isWithinServiceHours) {
          return false;
        }
      }
      // Amenities Filter
      if (filterAmenities.length > 0) {
        if (!branch.amenities || branch.amenities.length === 0) return false;
        
        // Ensure branch has ALL selected amenities
        const branchAmenityIds = branch.amenities.map((a: any) => a._id || a);
        const hasAllAmenities = filterAmenities.every(id => branchAmenityIds.includes(id));
        if (!hasAllAmenities) return false;
      }
      
      return true;
    });
  }, [branches, filterDistrict, filterStatus, filterGuests, filterTime, filterAmenities]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-amber-600 transition-colors">
              Trang chủ
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">
              Chi nhánh tại Cần Thơ
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {isLoading ? "Đang tải..." : `${filteredBranches.length} Chi nhánh`}
          </h1>
          <p className="text-gray-500">
            Danh sách các chi nhánh SpotOn đang hoạt động.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center font-bold text-gray-800">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    ></path>
                  </svg>
                  Bộ lọc
                </div>
                <button
                  onClick={() => {
                    setFilterDistrict("Tất cả quận");
                    setFilterStatus("Tất cả");
                    setFilterGuests(0);
                    setFilterAmenities([]);
                    setDraftDistrict("Tất cả quận");
                    setDraftStatus("Tất cả");
                    setDraftGuests(0);
                    setDraftAmenities([]);
                  }}
                  className="text-sm text-[#ea580c] hover:underline font-medium"
                >
                  Xóa tất cả
                </button>
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Quận / Huyện
                </label>
                <div className="relative">
                  <select
                    value={draftDistrict}
                    onChange={(e) => setDraftDistrict(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 appearance-none bg-gray-50 text-gray-700 outline-none focus:border-[#ea580c]"
                  >
                    <option>Tất cả quận</option>
                    <option>Ninh Kiều</option>
                    <option>Bình Thủy</option>
                    <option>Cái Răng</option>
                    <option>Ô Môn</option>
                    <option>Thốt Nốt</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Trạng thái
                </label>
                <div className="relative">
                  <select
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 appearance-none bg-gray-50 text-gray-700 outline-none focus:border-[#ea580c]"
                  >
                    <option>Tất cả</option>
                    <option>Đang mở</option>
                    <option>Đã đầy</option>
                    <option>Đã đóng</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Event Size */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Số lượng khách
                </label>
                <div className="flex items-center justify-between border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <button
                    onClick={() =>
                      setDraftGuests(Math.max(0, draftGuests - 1))
                    }
                    className="px-4 py-2 text-gray-500 hover:bg-gray-200 transition-colors font-medium"
                  >
                    ─
                  </button>
                  <span className="font-semibold text-gray-800">
                    {draftGuests === 0 ? "Bất kỳ" : `${draftGuests} Khách`}
                  </span>
                  <button
                    onClick={() => setDraftGuests(draftGuests + 1)}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-200 transition-colors font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Area Preferences */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Khu vực ưa thích
                </label>
                <div className="space-y-3">
                  {amenityList.length > 0 ? (
                    <>
                      {(showAllAmenities ? amenityList : amenityList.slice(0, 4)).map((amenity) => (
                        <label
                          key={amenity._id}
                          className="flex items-center cursor-pointer group"
                        >
                        <div className={`relative flex items-center justify-center w-5 h-5 mr-3 border rounded-md transition-colors ${
                          draftAmenities.includes(amenity._id) 
                            ? 'border-[#ea580c] bg-[#fffaf5]' 
                            : 'border-gray-300 bg-white group-hover:border-[#ea580c]'
                        }`}>
                          <input
                            type="checkbox"
                            className="opacity-0 absolute w-full h-full cursor-pointer"
                            checked={draftAmenities.includes(amenity._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDraftAmenities(prev => [...prev, amenity._id]);
                              } else {
                                setDraftAmenities(prev => prev.filter(id => id !== amenity._id));
                              }
                            }}
                          />
                          {draftAmenities.includes(amenity._id) && (
                            <svg
                              className="w-3 h-3 text-[#ea580c]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              ></path>
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{amenity.name}</span>
                      </label>
                      ))}
                      
                      {amenityList.length > 4 && (
                        <button
                          onClick={() => setShowAllAmenities(!showAllAmenities)}
                          className="text-sm font-medium text-[#ea580c] hover:underline flex items-center mt-2"
                        >
                          {showAllAmenities ? (
                            <>Ẩn bớt <span className="ml-1">↑</span></>
                          ) : (
                            <>Xem thêm {amenityList.length - 4} tiện ích <span className="ml-1">↓</span></>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Chưa có dữ liệu tiện ích</p>
                  )}
                </div>
              </div>

              <button 
                onClick={() => {
                  setFilterDistrict(draftDistrict);
                  setFilterStatus(draftStatus);
                  setFilterGuests(draftGuests);
                  setFilterAmenities(draftAmenities);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold py-3 rounded-lg transition-colors shadow-sm mt-4"
              >
                Áp dụng bộ lọc
              </button>

              <style>{`
                input[type="checkbox"]:checked + .checkmark {
                  display: block;
                }
                input[type="checkbox"]:checked ~ div {
                  border-color: #ea580c;
                  background-color: #fffaf5;
                }
              `}</style>
            </div>
          </div>

          {/* List of Branches */}
          <div className="w-full lg:w-3/4 flex flex-col gap-6">
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ea580c] mb-4"></div>
                <p className="text-gray-500 font-medium">
                  Đang tải danh sách chi nhánh...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <svg
                  className="w-10 h-10 text-red-400 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  ></path>
                </svg>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredBranches.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  ></path>
                </svg>
                <h3 className="text-lg font-bold text-gray-700 mb-1">
                  Không tìm thấy chi nhánh
                </h3>
                <p className="text-gray-500 text-sm">
                  Vui lòng thử thay đổi điều kiện tìm kiếm.
                </p>
              </div>
            )}

            {/* Branch Cards */}
            {!isLoading &&
              filteredBranches.map((branch, index) => {
                const statusInfo = STATUS_MAP[branch.status] || STATUS_MAP.OPEN;
                const serviceHours = getServiceHoursDisplay(branch);
                const totalCapacity = getTotalCapacity(branch);

                // Kiểm tra xem có bàn trống phù hợp với ngưỡng chênh lệch không (MAX_GAP = 2)
                let hasSuitableTable = false;
                const MAX_GAP = 2;
                if (filterGuests >= 10 || filterGuests <= 0) {
                  hasSuitableTable = true;
                } else {
                  if (branch.zones && branch.zones.length > 0) {
                    for (const zone of branch.zones) {
                      if (zone.tables && zone.tables.length > 0) {
                        for (const table of zone.tables) {
                          const cap = table.capacity || 0;
                          if (cap >= filterGuests && cap - filterGuests <= MAX_GAP) {
                            hasSuitableTable = true;
                            break;
                          }
                        }
                      }
                      if (hasSuitableTable) break;
                    }
                  }
                }

                return (
                  <div
                    key={branch._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow group"
                  >
                    {/* Image Section */}
                    <div className="w-full md:w-5/12 h-56 md:h-auto relative overflow-hidden flex-shrink-0">
                      <Image
                        src={getBranchImage(branch, index)}
                        alt={branch.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 40vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Status Badge */}
                      <div
                        className={`absolute top-4 left-4 ${statusInfo.bg} border ${statusInfo.color} text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm z-10`}
                      >
                        {statusInfo.label}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="w-full md:w-7/12 p-5 lg:p-6 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
                          {branch.name}
                        </h2>
                      </div>

                      {/* Address as description */}
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {getAddressDisplay(branch)}
                      </p>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-5">
                        {/* Location / District */}
                        <div className="flex items-center text-sm text-gray-600">
                          <svg
                            className="w-4 h-4 mr-2 text-[#ea580c] flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            ></path>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            ></path>
                          </svg>
                          <span className="truncate">
                            {getDistrictDisplay(branch)}
                          </span>
                        </div>

                        {/* Hotline */}
                        {branch.hotline && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg
                              className="w-4 h-4 mr-2 text-[#ea580c] flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              ></path>
                            </svg>
                            <span className="truncate">{branch.hotline}</span>
                          </div>
                        )}

                        {/* Capacity */}
                        {totalCapacity && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg
                              className="w-4 h-4 mr-2 text-[#ea580c] flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                              ></path>
                            </svg>
                            <span className="truncate">
                              Sức chứa: {totalCapacity} khách
                            </span>
                          </div>
                        )}

                        {/* Zone count */}
                        {branch.zones && branch.zones.length > 0 && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg
                              className="w-4 h-4 mr-2 text-[#ea580c] flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              ></path>
                            </svg>
                            <span className="truncate">
                              {branch.zones.length} khu vực
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Service Hours */}
                      {serviceHours && (
                        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-5">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            <svg
                              className="w-3.5 h-3.5 text-[#ea580c]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                            Giờ phục vụ
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1">
                            {serviceHours.map((h, i) => (
                              <span
                                key={i}
                                className="text-sm text-gray-700 font-medium"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                          {/* Current load indicator */}
                          <span
                            className={`text-[11px] font-medium px-2.5 py-1 rounded border ${statusInfo.bg} ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                          {branch.current_capacity_percent > 0 && (
                            <span className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded">
                              Tải: {branch.current_capacity_percent}%
                            </span>
                          )}
                        </div>

                        {hasSuitableTable ? (
                          <Link
                            href={`/branches/${branch._id}?date=${searchParams.get("date") || ""}&time=${searchParams.get("time") || ""}&guests=${searchParams.get("guests") || ""}`}
                            className="w-full sm:w-auto px-6 py-2.5 border-2 border-[#ea580c] text-[#ea580c] hover:bg-[#fff6f0] font-bold rounded-full text-sm transition-colors text-center shrink-0"
                          >
                            Xem chi tiết
                          </Link>
                        ) : (
                          <div className="flex flex-col items-end sm:items-center">
                            <span className="text-[11px] text-red-500 font-bold mb-1.5 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-100">Hết bàn trống phù hợp</span>
                            <a
                              href={`tel:${branch.hotline || '19001234'}`}
                              className="w-full sm:w-auto px-6 py-2 bg-red-500 text-white hover:bg-red-600 font-bold rounded-full text-sm transition-colors text-center shrink-0 flex items-center justify-center gap-2 shadow-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                              Gọi Hotline
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
