import { AOS } from '@/providers/AOS';

export function CuisinePromoSection() {
  return (
    <section id="cuisine-promo" className="py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <AOS animation="fade-up" duration={600} delay={0}>
          <div
            className="relative overflow-hidden rounded-2xl px-8 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8"
            style={{ background: 'linear-gradient(135deg, #0d2818 0%, #1a4028 50%, #0d3020 100%)' }}
          >
            <div className="absolute top-0 right-0 w-80 h-80 opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #4a9960 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-60 h-60 opacity-10 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #2d7a4a 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

            <div className="relative z-10 max-w-lg">
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#6dba8a' }}>Featured Cuisine</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4"
                style={{ fontFamily: "var(--font-playfair,'Playfair Display',serif)", lineHeight: 1.2 }}>
                Taste the Flavors<br /><span style={{ color: '#6dba8a' }}>of Italy</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Discover authentic Italian cuisine at our selected specialty branches. Reserve your table for a romantic evening.
              </p>
              <a href="/search?cuisine=italian" id="explore-italian-branches"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2d7a4a 0%, #4a9960 100%)', color: '#fff', boxShadow: '0 4px 16px rgba(45,122,74,0.4)' }}>
                Explore Italian Branches
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            <div className="relative z-10 hidden md:flex items-center justify-center w-56 h-56">
              <div className="absolute inset-0 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #4a9960 0%, transparent 70%)' }} />
              <div className="text-[100px] select-none filter drop-shadow-lg">🍝</div>
            </div>
          </div>
        </AOS>
      </div>
    </section>
  );
}
