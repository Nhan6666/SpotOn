import React from 'react';
import { Lightbulb } from 'lucide-react';

export function ProTipsSidebar({ currentStep = 1 }: { currentStep?: number }) {
  return (
    <div className="bg-green-50 rounded-xl border border-green-100 p-6">
      <div className="flex items-center gap-2 mb-6 text-green-800">
        <Lightbulb className="w-5 h-5" />
        <h3 className="text-lg font-bold">Pro Tips</h3>
      </div>
      
      <div className="space-y-4">
        {currentStep === 1 && (
          <>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
              <h4 className="text-sm font-bold text-gray-900 mb-1.5">Naming Conventions</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Use clear, geographically identifiable names. Avoid internal project codes (e.g., use "Westside Plaza" instead of "Project X2").
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
              <h4 className="text-sm font-bold text-gray-900 mb-1.5">Manager Assignment</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                You can leave the manager unassigned if hiring is still in progress. System alerts will notify you 14 days before opening if unassigned.
              </p>
            </div>
          </>
        )}
        
        {currentStep === 2 && (
          <>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
              <h4 className="text-sm font-bold text-gray-900 mb-1.5">Accurate Pinning</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Make sure the map pin accurately points to the entrance of the branch. This helps delivery partners and customers find you easily.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
              <h4 className="text-sm font-bold text-gray-900 mb-1.5">Hotline Formatting</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Provide a landline or official business mobile number. Consistent formatting (e.g., 028 xxxx xxxx) improves customer trust.
              </p>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-100">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Understanding Overload Threshold</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              The Overload Threshold is a crucial safety net for high-volume branches. When operational capacity (active tables + queued orders) hits this percentage, the system automatically:
            </p>
            <ul className="space-y-3 mb-4">
              <li className="flex items-start text-xs text-slate-600">
                <svg className="w-4 h-4 text-red-500 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Triggers an alert banner on the Branch Manager's POS interface.
              </li>
              <li className="flex items-start text-xs text-slate-600">
                <svg className="w-4 h-4 text-orange-500 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Temporarily pauses new online takeaway orders if configured in global settings.
              </li>
              <li className="flex items-start text-xs text-slate-600">
                <svg className="w-4 h-4 text-green-500 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Sends a push notification to regional directors for immediate support routing.
              </li>
            </ul>
            <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              INDUSTRY STANDARD: 80-85%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
