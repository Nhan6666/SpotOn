import { POPULAR_BRANCHES } from './home.constants';
import type { Branch } from './home.types';
import { AOS } from '@/providers/AOS';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5" fill={i < Math.round(rating) ? '#f0b843' : '#e5ddd0'} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function BranchCard({ branch, index }: { branch: Branch; index: number }) {
  return (
    <AOS animation="fade-up" duration={500} delay={index * 100}>
      <article
        className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{ background: '#fff', border: '1px solid #ede8df', boxShadow: '0 2px 12px rgba(26,18,8,0.07)' }}
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1208 0%, #3d2410 100%)' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"
              style={{ background: 'radial-gradient(circle, #c8891a 0%, transparent 70%)' }} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <button className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #c8891a 0%, #f0b843 100%)' }}>
            View Menu
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2">
          <h3 className="font-semibold text-base leading-tight" style={{ color: '#1a1208' }}>{branch.name}</h3>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6b5d4a' }}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {branch.location}
          </div>
          <div className="flex items-center gap-2">
            <StarRating rating={branch.rating} />
            <span className="text-xs font-medium" style={{ color: '#1a1208' }}>{branch.rating}</span>
            <span className="text-xs" style={{ color: '#6b5d4a' }}>({branch.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs" style={{ color: '#6b5d4a' }}>
              From <span className="font-semibold text-sm" style={{ color: '#c8891a' }}>${branch.priceFrom}</span>/person
            </span>
            <button className="flex items-center gap-1 text-xs font-medium transition-all duration-200 hover:gap-2" style={{ color: '#c8891a' }}>
              Reserve
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    </AOS>
  );
}

export function PopularBranchesSection() {
  return (
    <section id="popular-branches" className="py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <AOS animation="fade-up" duration={500} delay={0}>
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#c8891a' }}>Top Rated</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair,'Playfair Display',serif)", color: '#1a1208' }}>
              Popular Branches
            </h2>
            <p className="text-sm mt-2" style={{ color: '#6b5d4a' }}>Explore our most visited locations this month.</p>
          </div>
        </AOS>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {POPULAR_BRANCHES.map((branch, i) => (
            <BranchCard key={branch.id} branch={branch} index={i} />
          ))}
        </div>

        {/* CTA */}
        <AOS animation="fade-up" duration={500} delay={400}>
          <div className="text-center mt-8">
            <a href="/branches" id="view-all-branches"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{ border: '2px solid #c8891a', color: '#c8891a' }}>
              View All Branches
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </AOS>
      </div>
    </section>
  );
}
