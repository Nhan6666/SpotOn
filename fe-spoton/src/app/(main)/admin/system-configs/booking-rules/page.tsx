import React from 'react';
import { Metadata } from 'next';
import { BookingRulesFeature } from '@/features/admin/system-settings/BookingRulesFeature';

export const metadata: Metadata = {
  title: 'System Settings - Admin | SpotOn',
  description: 'Manage global settings for the SpotOn platform.',
};

export default function SettingsPage() {
  return <BookingRulesFeature />;
}
