import { Ticket, Clock } from 'lucide-react';
import { PUBLIC_TEXTS } from '@/constants/texts/public';

export function BranchVouchersTab({ vouchers }: { vouchers: any[] }) {
  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-12 text-center">
        <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 italic">{PUBLIC_TEXTS.branchDetail.vouchersTab.empty}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{PUBLIC_TEXTS.branchDetail.vouchersTab.title}</h3>
        <p className="text-gray-500 text-sm">{PUBLIC_TEXTS.branchDetail.vouchersTab.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vouchers.map((voucher, idx) => (
          <div key={voucher._id || idx} className="flex bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
            {/* Left side pattern */}
            <div className="w-8 bg-amber-500 flex flex-col items-center justify-between py-2 border-r border-dashed border-amber-600">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-3 h-3 bg-white rounded-full -ml-4" />
              ))}
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                  {voucher.code || PUBLIC_TEXTS.branchDetail.vouchersTab.codeFallback}
                </span>
                {voucher.discount_percentage && (
                  <span className="font-black text-xl text-[#ea580c]">-{voucher.discount_percentage}%</span>
                )}
              </div>
              
              <h4 className="font-bold text-gray-900 mb-1">{voucher.name || PUBLIC_TEXTS.branchDetail.vouchersTab.nameFallback}</h4>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{voucher.description || PUBLIC_TEXTS.branchDetail.vouchersTab.descFallback}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500 font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {PUBLIC_TEXTS.branchDetail.vouchersTab.expiry} {voucher.valid_until ? new Date(voucher.valid_until).toLocaleDateString('vi-VN') : PUBLIC_TEXTS.branchDetail.vouchersTab.noExpiry}
                </div>
                <button className="text-sm font-bold text-[#ea580c] hover:underline">
                  {PUBLIC_TEXTS.branchDetail.vouchersTab.copyBtn}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
