'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { ArrowLeft, ArrowRight, ChevronDown, Shield, Save, X } from 'lucide-react';

const timezoneOptions = [
  { label: 'UTC (Coordinated Universal Time)', value: 'utc' },
  { label: 'GMT+7 (Indochina Time)', value: 'gmt+7' },
  { label: 'GMT+8 (China Standard Time)', value: 'gmt+8' },
  { label: 'GMT-5 (Eastern Standard Time)', value: 'gmt-5' },
];

export function SystemConfigsFeature() {
  const [timezone, setTimezone] = useState('utc');
  const [overloadThreshold, setOverloadThreshold] = useState('85');
  const [noShowGrace, setNoShowGrace] = useState('15');
  const [twoStepLock, setTwoStepLock] = useState('5');
  const [preOrderMin, setPreOrderMin] = useState('24');
  const [refundLimit, setRefundLimit] = useState('48');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/admin/system-configs" className="flex items-center gap-3 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-slate-700">Back to Categories</span>
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" className="gap-2 border-gray-200 text-slate-600 hover:bg-slate-50">
            <X className="w-4 h-4" />
            Discard
          </Button>
          <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-8 space-y-8">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.24em] text-amber-700 font-semibold">General Policies</p>
          <h1 className="text-3xl font-semibold text-slate-900">Configure core system behaviors and default timings.</h1>
        </div>

        <div className="space-y-6">
          <Card className="border border-gray-100">
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Time & Localization</h2>
                  <p className="text-sm text-gray-500">Used as the fallback timezone for new branches.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_180px] items-end">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Default System Timezone</label>
                  <Select
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                    options={timezoneOptions}
                    placeholder="Select timezone"
                  />
                </div>
                <div className="text-xs text-gray-500">Applies when creating a new branch.</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100">
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Booking Rules</h2>
                <p className="text-sm text-gray-500">Set thresholds and timing rules that apply across all reservations.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Overload Threshold</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={overloadThreshold}
                      onChange={(event) => setOverloadThreshold(event.target.value)}
                      className="pr-16"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">%</span>
                  </div>
                  <p className="text-xs text-gray-500">Triggers system overload alerts.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">No-show Grace Period</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={noShowGrace}
                      onChange={(event) => setNoShowGrace(event.target.value)}
                      className="pr-16"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">Min</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Two-step Lock Time</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={twoStepLock}
                      onChange={(event) => setTwoStepLock(event.target.value)}
                      className="pr-16"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">Min</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Pre-order Min Time</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={preOrderMin}
                      onChange={(event) => setPreOrderMin(event.target.value)}
                      className="pr-16"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">Hours</span>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Refund Policy Limit</label>
                  <div className="relative max-w-xs">
                    <Input
                      type="number"
                      value={refundLimit}
                      onChange={(event) => setRefundLimit(event.target.value)}
                      className="pr-16"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">Hours</span>
                  </div>
                  <p className="text-xs text-gray-500">Prior to reservation time.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-red-100 bg-red-50">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-red-900">System Control</h2>
                  <p className="text-sm text-red-700">Halts all new public reservations across all branches. Internal dashboard remains accessible.</p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onChange={(event) => setMaintenanceMode(event.target.checked)}
                  label="Maintenance Mode"
                />
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-medium">Requires 2-step confirmation when saving.</p>
                <p className="text-gray-700 mt-1">Enable maintenance mode only when you need to pause new reservations temporarily across all branches.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

