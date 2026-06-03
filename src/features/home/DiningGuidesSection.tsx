import { DINING_GUIDES } from './home.constants';
import type { DiningGuide } from './home.types';
import { AOS } from '@/providers/AOS';

function GuideCard({ guide, index }: { guide: DiningGuide; index: number }) {
  return (
    <AOS animation="fade-up" duration={500} delay={index * 120}>
      <article
        id={`guide-${guide.id}`}
        className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{ background: '#fff', border: '1px solid #ede8df', boxShadow: '0 2px 12px rgba(26,18,8,0.07)' }}
      >
        <div className="relative overflow-hidden"
          style={{ height: 200, background: 'linear-gradient(135deg, #1a1208 0%, #3d2410 100%)' }}>
          <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-20">
            {guide.id === 'g1' ? '🍱' : guide.id === 'g2' ? '🍷' : '🥗'}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#c8891a', color: '#fff' }}>
            {guide.tag}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-base leading-tight line-clamp-2">{guide.title}</h3>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#6b5d4a' }}>{guide.excerpt}</p>
          <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid #ede8df' }}>
            <span className="text-xs" style={{ color: '#c8a870' }}>{guide.date}</span>
            <button className="flex items-center gap-1 text-xs font-medium transition-all duration-200 hover:gap-2" style={{ color: '#c8891a' }}>
              Read more
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    </AOS>
  );
}

export function DiningGuidesSection() {
  return (
    <section id="dining-guides" className="py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <AOS animation="fade-up" duration={500} delay={0}>
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#c8891a' }}>Editorial</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair,'Playfair Display',serif)", color: '#1a1208' }}>
              Latest Dining Guides
            </h2>
            <p className="text-sm mt-2" style={{ color: '#6b5d4a' }}>Stay updated with the latest culinary trends and recommendations.</p>
          </div>
        </AOS>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {DINING_GUIDES.map((guide, i) => (
            <GuideCard key={guide.id} guide={guide} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
