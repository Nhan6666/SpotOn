import React from 'react';
import { X, MapPin, Phone, User, Clock, Users, CheckCircle2 } from 'lucide-react';
import { Branch } from '../branch-management.types';

interface ViewBranchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
}

export function ViewBranchDetailsModal({ isOpen, onClose, branch }: ViewBranchDetailsModalProps) {
  if (!isOpen || !branch) return null;

  const DEFAULT_IMAGE = 'https://placehold.co/600x400/f3f4f6/a1a1aa?text=No+Image';
  const getImageUrl = (b: Branch) => {
    if (b.images && Array.isArray(b.images) && b.images.length > 0 && b.images[0]) {
      return b.images[0];
    }
    return DEFAULT_IMAGE;
  };

  const fullAddress = typeof branch.address === 'object' 
    ? `${branch.address.full}, ${branch.address.ward}, ${branch.address.district}, ${branch.address.city}`
    : branch.address;

  const managerName = branch.manager_id && typeof branch.manager_id === 'object' && branch.manager_id.full_name
    ? branch.manager_id.full_name
    : 'Chưa chỉ định';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Image */}
        <div className="relative h-48 w-full bg-gray-100 flex-shrink-0">
          <img 
            src={getImageUrl(branch)} 
            alt={branch.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== DEFAULT_IMAGE) target.src = DEFAULT_IMAGE;
            }}
          />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-amber-400 font-bold text-sm tracking-wider uppercase mb-1 block">
                  SP-{branch._id.substring(branch._id.length - 4).toUpperCase()}
                </span>
                <h2 className="text-2xl font-bold text-white">{branch.name}</h2>
              </div>
              <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase border border-white/30">
                {branch.status}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Address & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Địa chỉ</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{fullAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400 flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Hotline</p>
                  <p className="text-sm text-gray-900">{branch.hotline || <span className="italic text-gray-400">Không có</span>}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100"></div>

            {/* Manager & Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600 flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Quản lý chi nhánh</p>
                  <p className="text-sm font-medium text-gray-900">{managerName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Công suất hiện tại</p>
                  {branch.status === 'SETUP' ? (
                    <p className="text-sm text-gray-500 italic">Chưa hoạt động</p>
                  ) : (
                    <div className="flex items-center mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 mr-3 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${(branch.current_capacity_percent || 0) > branch.overload_threshold ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{ width: `${branch.current_capacity_percent || 0}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-bold ${(branch.current_capacity_percent || 0) > branch.overload_threshold ? 'text-red-600' : 'text-gray-900'}`}>
                        {branch.current_capacity_percent || 0}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100"></div>

            {/* Service Periods */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Giờ phục vụ</h3>
              </div>
              
              {branch.service_periods ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="font-bold text-gray-800 text-sm">Ca Trưa</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Mở/Đóng:</span>
                      <span className="font-semibold text-gray-900">{branch.service_periods.lunch?.start || '--'} - {branch.service_periods.lunch?.end || '--'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last order:</span>
                      <span className="font-medium text-gray-700">{branch.service_periods.lunch?.last_order || '--'}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="font-bold text-gray-800 text-sm">Ca Tối</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Mở/Đóng:</span>
                      <span className="font-semibold text-gray-900">{branch.service_periods.dinner?.start || '--'} - {branch.service_periods.dinner?.end || '--'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last order:</span>
                      <span className="font-medium text-gray-700">{branch.service_periods.dinner?.last_order || '--'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-600">Giờ hoạt động chung: <span className="font-bold">{branch.open_time} - {branch.close_time}</span></p>
                </div>
              )}
            </div>

          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
