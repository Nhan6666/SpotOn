import { PublicBranchDetail } from '../branch-detail.types';
import { Clock, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export function BranchInfoTab({ branch }: { branch: PublicBranchDetail }) {
  const address = typeof branch.address === 'object' ? branch.address.full : branch.address;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Main Info */}
      <div className="md:col-span-2 space-y-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Về chi nhánh</h3>
          <p className="text-gray-600 leading-relaxed">
            {branch.description || 'Chi nhánh này chưa có mô tả. Tuy nhiên, chúng tôi luôn cam kết mang lại không gian sang trọng và dịch vụ đẳng cấp nhất cho quý khách. Kính mời quý khách đến trải nghiệm thực đơn đa dạng và không gian tuyệt vời tại chi nhánh này.'}
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Tiện ích nổi bật</h3>
          <div className="grid grid-cols-2 gap-4">
            {branch.amenities && branch.amenities.length > 0 ? (
              branch.amenities.map((amenity: any, idx: number) => (
                <div key={idx} className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                  <span className="font-medium text-sm">{amenity.name || amenity}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic col-span-2">Chi nhánh đang cập nhật tiện ích.</p>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="space-y-6">
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-amber-200 pb-3">Liên hệ & Giờ mở cửa</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-[#ea580c] mr-3 mt-0.5" />
              <div>
                <span className="block text-sm font-bold text-gray-900">Địa chỉ</span>
                <span className="text-sm text-gray-600 mt-1 block leading-relaxed">{address}</span>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="w-5 h-5 text-[#ea580c] mr-3 mt-0.5" />
              <div>
                <span className="block text-sm font-bold text-gray-900">Hotline</span>
                <span className="text-sm text-gray-600 mt-1 block font-medium">{branch.hotline || 'Đang cập nhật'}</span>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="w-5 h-5 text-[#ea580c] mr-3 mt-0.5" />
              <div className="w-full">
                <span className="block text-sm font-bold text-gray-900 mb-2">Giờ phục vụ</span>
                
                {branch.service_periods?.lunch?.start && (
                  <div className="bg-white rounded p-2 mb-2 border border-amber-100">
                    <span className="text-xs font-bold uppercase text-amber-700 block mb-1">Trưa</span>
                    <span className="text-sm text-gray-700">{branch.service_periods.lunch.start} - {branch.service_periods.lunch.end}</span>
                  </div>
                )}
                
                {branch.service_periods?.dinner?.start && (
                  <div className="bg-white rounded p-2 border border-amber-100">
                    <span className="text-xs font-bold uppercase text-indigo-700 block mb-1">Tối</span>
                    <span className="text-sm text-gray-700">{branch.service_periods.dinner.start} - {branch.service_periods.dinner.end}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
