import React from 'react';
import { Metadata } from 'next';
import { AmenitiesFeature } from '@/features/admin/system-settings/amenities/components/AmenitiesFeature';

export const metadata: Metadata = {
  title: 'Amenities Management - Admin | SpotOn',
  description: 'Manage branch amenities.',
};

export default function AmenitiesPage() {
  return <AmenitiesFeature />;
}
