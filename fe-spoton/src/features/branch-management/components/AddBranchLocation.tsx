import React from 'react';
import { MapPin, Phone } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export function AddBranchLocation() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Location & Contact</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Full Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input 
              placeholder="e.g., 123 Nguyen Hue Street" 
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              City / Province <span className="text-red-500">*</span>
            </label>
            <Select 
              defaultValue=""
              options={[
                { label: 'Ho Chi Minh City', value: 'hcmc' },
                { label: 'Hanoi', value: 'hn' },
                { label: 'Da Nang', value: 'dn' }
              ]} 
              placeholder="Select city..." 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              District <span className="text-red-500">*</span>
            </label>
            <Select 
              defaultValue=""
              options={[
                { label: 'District 1', value: 'd1' },
                { label: 'District 2', value: 'd2' },
                { label: 'District 3', value: 'd3' }
              ]} 
              placeholder="Select district..." 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Branch Hotline <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Input 
              placeholder="e.g., 028 1234 5678" 
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">This number will be displayed to customers for reservations.</p>
        </div>

        {/* Map Placeholder */}
        <div className="mt-8">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Pin Location
          </label>
          <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
            <MapPin className="w-8 h-8 text-amber-500 mb-2 z-10 drop-shadow-md" />
            <span className="text-sm font-medium text-gray-500 z-10">Map preview will appear after selecting a district</span>
          </div>
        </div>
      </div>
    </div>
  );
}
