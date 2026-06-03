import Link from 'next/link';

export function SpecialOffers() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-playfair tracking-tight">Special Offers</h2>
          <p className="text-gray-500 text-sm">Exclusive deals for your next dining experience.</p>
        </div>
        <Link href="/offers" className="text-amber-500 hover:text-amber-600 text-sm font-medium flex items-center transition-colors">
          See All Offers <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Offer 1 */}
        <div className="bg-[#e68a1a] rounded-2xl p-8 text-white relative overflow-hidden group h-full flex flex-col justify-between items-start shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-12 -translate-y-12 transition-transform duration-500 group-hover:scale-150"></div>
          <div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">LIMITED TIME</div>
            <h3 className="text-2xl font-bold mb-2">20% Off Set Menu</h3>
            <p className="text-white text-opacity-90 text-sm mb-6 max-w-[85%]">
              Valid at Downtown Prime branch for groups of 4+.
            </p>
          </div>
          <button className="px-5 py-2 bg-white text-[#e68a1a] text-sm font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm">
            Claim Offer
          </button>
        </div>

        {/* Offer 2 */}
        <div className="bg-[#3e5f48] rounded-2xl p-8 text-white relative overflow-hidden group h-full flex flex-col justify-between items-start shadow-md">
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full translate-x-10 translate-y-10 transition-transform duration-500 group-hover:scale-125"></div>
          <div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">NEW MEMBER</div>
            <h3 className="text-2xl font-bold mb-2">Free Dessert</h3>
            <p className="text-white text-opacity-90 text-sm mb-6 max-w-[85%]">
              Sign up and get a free dessert on your first booking.
            </p>
          </div>
          <button className="px-5 py-2 bg-white text-[#3e5f48] text-sm font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm">
            Sign Up
          </button>
        </div>

        {/* Offer 3 */}
        <div className="bg-[#2a2f3a] rounded-2xl p-8 text-white relative overflow-hidden group h-full flex flex-col justify-between items-start shadow-md">
          <div className="absolute top-1/2 right-0 w-24 h-24 bg-white opacity-5 rounded-full translate-x-4 -translate-y-1/2 transition-transform duration-500 group-hover:scale-[2]"></div>
          <div>
             <div className="bg-white bg-opacity-20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">CATERING</div>
             <h3 className="text-2xl font-bold mb-2">Complimentary Setup</h3>
             <p className="text-white text-opacity-90 text-sm mb-6 max-w-[85%]">
               Free premium setup for catering events over $500.
             </p>
          </div>
          <button className="px-5 py-2 bg-white text-[#2a2f3a] text-sm font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm">
            View Details
          </button>
        </div>
      </div>
    </section>
  );
}
