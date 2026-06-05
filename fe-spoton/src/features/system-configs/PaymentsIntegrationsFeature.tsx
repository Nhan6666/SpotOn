'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Save, X, Wallet, Zap, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

export function PaymentsIntegrationsFeature() {
  const [tableDepositAmount, setTableDepositAmount] = useState('500,000');
  const [vnpayTmnCode, setVnpayTmnCode] = useState('••••••••••');
  const [vnpayHashSecret, setVnpayHashSecret] = useState('•••••••••••••••••••••');
  const [environment, setEnvironment] = useState('sandbox');
  const [smtpServer, setSmtpServer] = useState('smtp.mailgun.org');
  const [googleOAuthId, setGoogleOAuthId] = useState('1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com');
  const [showTmnCode, setShowTmnCode] = useState(false);
  const [showHashSecret, setShowHashSecret] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
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

      {/* Title Section */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Payments &amp; Integrations</h1>
        <p className="text-gray-500">Configure payment gateways and third-party service connections.</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* VNPay Settings */}
          <Card className="border-gray-100">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">VNPay Settings</h3>
                  <p className="text-sm text-gray-500">Manage your VNPay gateway credentials and rules.</p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Default Table Deposit Amount */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600 tracking-wider uppercase">
                  Default Table Deposit Amount
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={tableDepositAmount}
                    onChange={(e) => setTableDepositAmount(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-100"
                  />
                  <div className="flex items-center px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-medium text-sm">
                    VND
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Required deposit for booking a standard table.</p>
              </div>

              {/* VNPay TMN Code & Hash Secret Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 tracking-wider uppercase">
                    VNPay TMN Code
                  </label>
                  <div className="relative">
                    <Input
                      type={showTmnCode ? 'text' : 'password'}
                      value={vnpayTmnCode}
                      onChange={(e) => setVnpayTmnCode(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-100 pr-10"
                    />
                    <button
                      onClick={() => setShowTmnCode(!showTmnCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showTmnCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 tracking-wider uppercase">
                    VNPay Hash Secret
                  </label>
                  <div className="relative">
                    <Input
                      type={showHashSecret ? 'text' : 'password'}
                      value={vnpayHashSecret}
                      onChange={(e) => setVnpayHashSecret(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-100 pr-10"
                    />
                    <button
                      onClick={() => setShowHashSecret(!showHashSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showHashSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Environment */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600 tracking-wider uppercase">
                  Environment
                </label>
                <Select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  options={[
                    { label: 'Sandbox (Testing)', value: 'sandbox' },
                    { label: 'Production', value: 'production' },
                  ]}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-100"
                />
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card className="border-gray-100">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg shrink-0 mt-0.5">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Third-Party Services</h3>
                  <p className="text-sm text-gray-500">Connect external tools for notifications and auth.</p>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Notification SMTP Server */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600 tracking-wider uppercase">
                  Notification SMTP Server
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={smtpServer}
                    onChange={(e) => setSmtpServer(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-100 pl-10"
                    icon="✉"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">✉</span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">For sending system notifications and OTP emails.</p>
              </div>

              {/* Google OAuth Client ID */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600 tracking-wider uppercase">
                  Google OAuth Client ID
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={googleOAuthId}
                    onChange={(e) => setGoogleOAuthId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-100 pl-10 text-sm font-mono"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔐</span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Required for staff login via Google Workspace.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          {/* Connection Status */}
          <Card className="border-gray-100">
            <CardContent className="p-5 space-y-4">
              <h4 className="font-semibold text-gray-900">Connection Status</h4>

              {/* VNPay API */}
              <div className="flex items-center justify-between py-3 px-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-sm text-gray-700">VNPay API</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase bg-emerald-100 px-2 py-1 rounded">
                  Active
                </span>
              </div>

              {/* SMTP */}
              <div className="flex items-center justify-between py-3 px-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-sm text-gray-700">SMTP</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase bg-emerald-100 px-2 py-1 rounded">
                  Connected
                </span>
              </div>

              {/* ZaloPay */}
              <div className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0"></span>
                  <span className="text-sm text-gray-600">ZaloPay</span>
                </div>
                <span className="text-xs font-bold text-gray-500 tracking-wider uppercase bg-gray-100 px-2 py-1 rounded">
                  Setup
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Security Note */}
          <Card className="border-yellow-100 bg-yellow-50/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <h4 className="font-semibold text-sm text-gray-900">Security Note</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Secrets and client IDs are encrypted at rest. Changes to these settings will be logged in the system audit trail.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
