import React from 'react';
import { Metadata } from 'next';
import { AmenitiesFeature } from '@/features/admin/system-settings/amenities/components/AmenitiesFeature';

export const metadata: Metadata = {
  title: 'Amenities Management - Admin | SpotOn',
  description: 'Manage branch amenities.',
};

export default function AmenitiesPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <AmenitiesFeature />
    </div>
  );
}
