import React from 'react';

export function AdminFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 py-3 px-8 text-center text-[11px] text-gray-400 font-medium flex-shrink-0 z-20 w-full">
      &copy; {new Date().getFullYear()} SpotOn Enterprise Management. All rights reserved.
    </footer>
  );
}
