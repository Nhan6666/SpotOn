'use client';

import { useEffect } from 'react';
import AosLib from 'aos';
import 'aos/dist/aos.css';

/**
 * AOSProvider — initializes the AOS library once on mount (client-only).
 * Place this inside RootLayout wrapping {children}.
 */
export function AOSProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    AosLib.init({
      once: true,        // animate only the first time element scrolls into view
      duration: 600,     // default duration (ms)
      easing: 'ease-out-cubic',
      offset: 60,        // px from bottom of window before triggering
    });
  }, []);

  return <>{children}</>;
}
