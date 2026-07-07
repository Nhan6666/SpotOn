import { PublicBranchDetail } from '../branch-detail.types';
import { Clock, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { PUBLIC_TEXTS } from '@/constants/texts/public';

export function BranchInfoTab({ branch }: { branch: PublicBranchDetail }) {
  const address = typeof branch.address === 'object' ? branch.address.full : branch.address;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Main Info */}
      <div className="md:col-span-2 space-y-8">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">{PUBLIC_TEXTS.branchDetail.overview.about}</h3>
          <p className="text-gray-600 leading-relaxed">
            {branch.description || PUBLIC_TEXTS.branchDetail.overview.aboutDescFallback}
          </p>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">{PUBLIC_TEXTS.branchDetail.overview.amenities}</h3>
          <div className="grid grid-cols-2 gap-4">
            {branch.amenities && branch.amenities.length > 0 ? (
              branch.amenities.map((amenity: any, idx: number) => (
                <div key={idx} className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                  <span className="font-medium text-sm">{amenity.name || amenity}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic col-span-2">{PUBLIC_TEXTS.branchDetail.overview.noAmenities}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="space-y-6">
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-amber-200 pb-3">{PUBLIC_TEXTS.branchDetail.overview.contact}</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-[#ea580c] mr-3 mt-0.5" />
              <div>
                <span className="block text-sm font-bold text-gray-900">{PUBLIC_TEXTS.branchDetail.overview.address}</span>
                <span className="text-sm text-gray-600 mt-1 block leading-relaxed">{address}</span>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="w-5 h-5 text-[#ea580c] mr-3 mt-0.5" />
              <div>
                <span className="block text-sm font-bold text-gray-900">{PUBLIC_TEXTS.branchDetail.overview.hotline}</span>
                <span className="text-sm text-gray-600 mt-1 block font-medium">{branch.hotline || PUBLIC_TEXTS.branchDetail.overview.hotlineFallback}</span>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="w-5 h-5 text-[#ea580c] mr-3 mt-0.5" />
              <div className="w-full">
                <span className="block text-sm font-bold text-gray-900 mb-2">{PUBLIC_TEXTS.branchDetail.overview.serviceHours}</span>
                
                {branch.service_periods?.lunch?.start && (
                  <div className="bg-white rounded p-2 mb-2 border border-amber-100">
                    <span className="text-xs font-bold uppercase text-amber-700 block mb-1">{PUBLIC_TEXTS.branchDetail.overview.lunch}</span>
                    <span className="text-sm text-gray-700">{branch.service_periods.lunch.start} - {branch.service_periods.lunch.end}</span>
                  </div>
                )}
                
                {branch.service_periods?.dinner?.start && (
                  <div className="bg-white rounded p-2 border border-amber-100">
                    <span className="text-xs font-bold uppercase text-indigo-700 block mb-1">{PUBLIC_TEXTS.branchDetail.overview.dinner}</span>
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
