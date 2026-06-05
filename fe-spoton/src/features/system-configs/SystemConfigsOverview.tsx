'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Shield, CreditCard, Info, ArrowRight } from 'lucide-react';

export function SystemConfigsOverview() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            System Configurations
          </h1>
          <p className="text-gray-500 text-base">
            Manage global platform settings and default rules.
          </p>
        </div>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Policies */}
        <Link href="/admin/system-configs/general-policies" className="block">
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 text-orange-500 rounded-lg shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">General Policies</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Manage timezones, booking rules, and system maintenance mode.
                  </p>
                </div>
              </div>
              <hr className="my-4 border-gray-100" />
              <div className="flex justify-end">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 group">
                  Configure
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Payments & Integrations */}
        <Card className="hover:shadow-lg transition-all cursor-pointer opacity-60">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-semibold text-lg text-gray-900">Payments &amp; Integrations</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Configure VNPay settings, table deposits, and third-party service credentials.
                </p>
              </div>
            </div>
            <hr className="my-4 border-gray-100" />
            <div className="flex justify-end">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group">
                Configure
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="border-gray-100">
        <CardContent className="p-5 flex items-start sm:items-center gap-4">
          <div className="text-gray-400 shrink-0 mt-0.5 sm:mt-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2">
              System Status
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <p className="text-sm text-gray-700">
                All systems operational. Last configuration backup: Today at 08:00 AM.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
