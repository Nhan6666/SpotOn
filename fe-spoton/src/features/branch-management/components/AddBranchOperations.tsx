import React from 'react';
import { Clock, Info } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';

export interface AddBranchOperationsProps {
  initialData?: {
    openTime?: string;
    closeTime?: string;
    threshold?: number;
    isOpeningSoon?: boolean;
    services?: { dineIn: boolean; takeaway: boolean; delivery: boolean; catering: boolean };
  };
}

export function AddBranchOperations({ initialData }: AddBranchOperationsProps = {}) {
  const [threshold, setThreshold] = React.useState(initialData?.threshold ?? 85);
  const [isOpeningSoon, setIsOpeningSoon] = React.useState(initialData?.isOpeningSoon ?? true);
  const [services, setServices] = React.useState(initialData?.services || {
    dineIn: true,
    takeaway: true,
    delivery: false,
    catering: false
  });

  const toggleService = (key: keyof typeof services) => {
    setServices(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Operational Rules</h2>
      
      <div className="space-y-10">
        
        {/* Operating Hours */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Standard Operating Hours</h3>
          <p className="text-sm text-gray-500 mb-4">Define the typical baseline schedule for this location.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Opening Time
              </label>
              <Input 
                type="time" 
                defaultValue={initialData?.openTime || "09:00"}
                icon={<Clock className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Closing Time
              </label>
              <Input 
                type="time" 
                defaultValue={initialData?.closeTime || "22:00"}
                icon={<Clock className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Overload Threshold */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 relative">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base font-bold text-gray-900">Overload Threshold</h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">{threshold}%</span>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Alert branch managers when capacity or order volume reaches this critical level.
          </p>
          
          <input 
            type="range" 
            min="50" 
            max="100" 
            value={threshold} 
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs font-medium text-gray-500 mt-2">
            <span>50% (Conservative)</span>
            <span>100% (Maximum)</span>
          </div>
        </div>

        {/* Initial Service Status */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Initial Service Status</h3>
          <p className="text-sm text-gray-500 mb-4">Set the public-facing status for this branch upon creation.</p>
          <div className="border border-gray-200 rounded-lg p-4 flex items-center">
            <Switch 
              checked={isOpeningSoon} 
              onChange={(e) => setIsOpeningSoon(e.target.checked)} 
              label={isOpeningSoon ? 'Closed / Opening Soon' : 'Open / Accepting Orders'}
            />
          </div>
        </div>

        {/* Available Services */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Available Services</h3>
          <p className="text-sm text-gray-500 mb-4">Select all operational modes supported by this location.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ServiceCard 
              title="Dine-in" 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
              checked={services.dineIn}
              onClick={() => toggleService('dineIn')}
            />
            <ServiceCard 
              title="Takeaway" 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
              checked={services.takeaway}
              onClick={() => toggleService('takeaway')}
            />
            <ServiceCard 
              title="Delivery" 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
              checked={services.delivery}
              onClick={() => toggleService('delivery')}
            />
            <ServiceCard 
              title="Catering" 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              checked={services.catering}
              onClick={() => toggleService('catering')}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function ServiceCard({ title, icon, checked, onClick }: { title: string, icon: React.ReactNode, checked: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`border rounded-lg p-4 flex items-center cursor-pointer transition-colors ${
        checked ? 'border-amber-600 bg-amber-50/30 text-amber-900' : 'border-gray-200 hover:border-gray-300 text-gray-700'
      }`}
    >
      <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 border ${checked ? 'bg-amber-600 border-amber-600' : 'border-gray-300'}`}>
        {checked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </div>
      <div className={`mr-2 ${checked ? 'text-amber-700' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span className="font-semibold text-sm">{title}</span>
    </div>
  );
}
