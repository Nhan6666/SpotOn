import { CATEGORY_BANNERS } from './home.constants';
import { AOS } from '@/providers/AOS';

export function CategoryBannersSection() {
  return (
    <section id="categories" className="py-2 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {CATEGORY_BANNERS.map((cat, i) => (
            <AOS key={cat.id} animation="zoom-in" duration={400} delay={i * 80}>
              <a
                href={cat.href}
                id={`category-${cat.id}`}
                className="group relative flex items-center justify-center h-16 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: cat.bg, border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, rgba(200,137,26,0.15) 0%, transparent 100%)' }} />
                <div className="relative flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm font-semibold text-white">{cat.label}</span>
                </div>
                <svg className="absolute right-4 w-4 h-4 opacity-0 group-hover:opacity-60 transition-all duration-300 group-hover:translate-x-0 -translate-x-2"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#fff' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </AOS>
          ))}
        </div>
      </div>
    </section>
  );
}
