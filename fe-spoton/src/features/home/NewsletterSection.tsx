'use client';

import { useState } from 'react';
import { AOS } from '@/providers/AOS';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section id="newsletter" className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <AOS animation="fade-up" duration={600} delay={0}>
          <div
            className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl px-8 py-8"
            style={{
              background: 'linear-gradient(135deg, #c8891a 0%, #a06a10 100%)',
              boxShadow: '0 8px 32px rgba(200,137,26,0.25)',
            }}
          >
            <div className="text-white">
              <h2 className="text-xl font-bold mb-1">Subscribe to our Newsletter</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Get the scoop on new offers, weekend outings, &amp; culinary trends.
              </p>
            </div>

            {submitted ? (
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                You&apos;re subscribed!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto" style={{ maxWidth: 420 }}>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    minWidth: 220,
                  }}
                />
                <button type="submit" id="newsletter-subscribe"
                  className="px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
                  style={{ background: '#1a1208', color: '#f0b843' }}>
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </AOS>
      </div>
    </section>
  );
}
