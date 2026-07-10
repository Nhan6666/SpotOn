"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useBranchDetail } from './useBranchDetail';
import { MapPin, Phone, Clock, Wifi, ParkingCircle, CheckCircle2 } from 'lucide-react';
import { BranchInfoTab } from './components/BranchInfoTab';
import { BranchBookingTab } from './components/BranchBookingTab';
import { BranchMenuTab } from './components/BranchMenuTab';
import { BranchVouchersTab } from './components/BranchVouchersTab';
import { STATUS_MAP } from '../branches/branches.constants';
import { PUBLIC_TEXTS } from '@/constants/texts/public';

export function BranchDetailFeature({ branchId }: { branchId: string }) {
  const { branch, menu, vouchers, isLoading, error } = useBranchDetail(branchId);
  const [activeTab, setActiveTab] = useState<'booking' | 'info' | 'menu' | 'vouchers'>('booking');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ea580c] mb-4"></div>
        <p className="text-gray-500 font-medium">{PUBLIC_TEXTS.branches.list.loading}</p>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="min-h-screen bg-[#fafafa] py-20 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{PUBLIC_TEXTS.branches.list.notFound.title}</h2>
          <p className="text-gray-500 mb-6">{error || PUBLIC_TEXTS.branches.list.notFound.desc}</p>
          <Link href="/branches" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#ea580c] hover:bg-[#c2410c] transition-colors">
            {PUBLIC_TEXTS.branchDetail.backBtn}
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[branch.status] || STATUS_MAP.OPEN;
  const address = typeof branch.address === 'object' ? branch.address.full : branch.address;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Header Banner */}
      <div className="relative h-64 md:h-80 w-full bg-gray-900">
        <Image 
          src={branch.images && branch.images.length > 0 ? branch.images[0] : 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1934&auto=format&fit=crop'} 
          alt={branch.name}
          fill
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full">
          <div className="container mx-auto px-4 max-w-6xl pb-8">
            <div className="flex items-center text-sm text-gray-300 mb-4">
              <Link href="/" className="hover:text-white transition-colors">{PUBLIC_TEXTS.branches.header.breadcrumbs.home}</Link>
              <span className="mx-2">›</span>
              <Link href="/branches" className="hover:text-white transition-colors">{PUBLIC_TEXTS.branches.header.title}</Link>
              <span className="mx-2">›</span>
              <span className="text-white font-medium truncate">{branch.name}</span>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${statusInfo.bg} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{branch.name}</h1>
                <div className="flex items-start text-gray-300 mt-2">
                  <MapPin className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-[#ea580c]" />
                  <span className="text-base">{address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl -mt-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden relative z-10">
          
          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar">
            <button 
              onClick={() => setActiveTab('booking')}
              className={`flex-1 min-w-[120px] py-4 px-6 text-sm font-bold uppercase tracking-wide text-center transition-colors border-b-2 ${activeTab === 'booking' ? 'border-[#ea580c] text-[#ea580c] bg-amber-50/30' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Đặt bàn
            </button>
            <button 
              onClick={() => setActiveTab('info')}
              className={`flex-1 min-w-[120px] py-4 px-6 text-sm font-bold uppercase tracking-wide text-center transition-colors border-b-2 ${activeTab === 'info' ? 'border-[#ea580c] text-[#ea580c] bg-amber-50/30' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              {PUBLIC_TEXTS.branchDetail.tabs.overview}
            </button>
            <button 
              onClick={() => setActiveTab('menu')}
              className={`flex-1 min-w-[120px] py-4 px-6 text-sm font-bold uppercase tracking-wide text-center transition-colors border-b-2 ${activeTab === 'menu' ? 'border-[#ea580c] text-[#ea580c] bg-amber-50/30' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              {PUBLIC_TEXTS.branchDetail.tabs.menu}
            </button>
            <button 
              onClick={() => setActiveTab('vouchers')}
              className={`flex-1 min-w-[120px] py-4 px-6 text-sm font-bold uppercase tracking-wide text-center transition-colors border-b-2 ${activeTab === 'vouchers' ? 'border-[#ea580c] text-[#ea580c] bg-amber-50/30' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Ưu đãi
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {activeTab === 'info' && <BranchInfoTab branch={branch} />}
            {activeTab === 'booking' && <BranchBookingTab branch={branch} />}
            {activeTab === 'menu' && <BranchMenuTab menu={menu} />}
            {activeTab === 'vouchers' && <BranchVouchersTab vouchers={vouchers} />}
          </div>

        </div>
      </div>
    </div>
  );
}
