import Link from 'next/link';
import { HOME_TEXTS } from '@/constants/texts/home';

export function SpecialOffers() {
  const { specialOffers } = HOME_TEXTS;
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-playfair tracking-tight">{specialOffers.title}</h2>
          <p className="text-gray-500 text-sm">{specialOffers.subtitle}</p>
        </div>
        <Link href="/offers" className="text-amber-500 hover:text-amber-600 text-sm font-medium flex items-center transition-colors">
          {specialOffers.viewAllBtn} <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Offer 1 */}
        <div className="bg-[#e68a1a] rounded-2xl p-8 text-white relative overflow-hidden group h-full flex flex-col justify-between items-start shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-12 -translate-y-12 transition-transform duration-500 group-hover:scale-150"></div>
          <div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">{specialOffers.offers[0].badge}</div>
            <h3 className="text-2xl font-bold mb-2">{specialOffers.offers[0].title}</h3>
            <p className="text-white text-opacity-90 text-sm mb-6 max-w-[85%]">
              {specialOffers.offers[0].desc}
            </p>
          </div>
          <button className="px-5 py-2 bg-white text-[#e68a1a] text-sm font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm">
            {specialOffers.offers[0].btnText}
          </button>
        </div>

        {/* Offer 2 */}
        <div className="bg-[#3e5f48] rounded-2xl p-8 text-white relative overflow-hidden group h-full flex flex-col justify-between items-start shadow-md">
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full translate-x-10 translate-y-10 transition-transform duration-500 group-hover:scale-125"></div>
          <div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">{specialOffers.offers[1].badge}</div>
            <h3 className="text-2xl font-bold mb-2">{specialOffers.offers[1].title}</h3>
            <p className="text-white text-opacity-90 text-sm mb-6 max-w-[85%]">
              {specialOffers.offers[1].desc}
            </p>
          </div>
          <button className="px-5 py-2 bg-white text-[#3e5f48] text-sm font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm">
            {specialOffers.offers[1].btnText}
          </button>
        </div>

        {/* Offer 3 */}
        <div className="bg-[#2a2f3a] rounded-2xl p-8 text-white relative overflow-hidden group h-full flex flex-col justify-between items-start shadow-md">
          <div className="absolute top-1/2 right-0 w-24 h-24 bg-white opacity-5 rounded-full translate-x-4 -translate-y-1/2 transition-transform duration-500 group-hover:scale-[2]"></div>
          <div>
             <div className="bg-white bg-opacity-20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">{specialOffers.offers[2].badge}</div>
             <h3 className="text-2xl font-bold mb-2">{specialOffers.offers[2].title}</h3>
             <p className="text-white text-opacity-90 text-sm mb-6 max-w-[85%]">
               {specialOffers.offers[2].desc}
             </p>
          </div>
          <button className="px-5 py-2 bg-white text-[#2a2f3a] text-sm font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm">
            {specialOffers.offers[2].btnText}
          </button>
        </div>
      </div>
    </section>
  );
}
