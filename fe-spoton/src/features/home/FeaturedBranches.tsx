import Link from 'next/link';
import Image from 'next/image';

export function FeaturedBranches() {
  return (
    <section className="container mx-auto px-4 py-16 mb-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-playfair tracking-tight">Featured Branches</h2>
          <p className="text-gray-500 text-sm">Discover our top-rated locations for your next event.</p>
        </div>
        <Link href="/branches" className="text-amber-500 hover:text-amber-600 text-sm font-medium flex items-center transition-colors">
          View All <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Branch Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col group">
          <div className="relative h-[320px] w-full overflow-hidden">
            <Image 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1740&auto=format&fit=crop" 
              alt="SpotOn Downtown Prime" 
              fill 
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Badges */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center shadow-sm">
              <svg className="w-4 h-4 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
              <span className="text-xs font-bold text-gray-800">4.9 <span className="font-normal text-gray-500">(120+ reviews)</span></span>
            </div>
            <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center">
               <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></span>
               OPEN
            </div>
          </div>
          <div className="p-6 flex flex-col justify-between flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-amber-500 transition-colors">SpotOn Downtown Prime</h3>
                <div className="flex items-center text-gray-500 text-sm mb-1">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  123 Main St, District 1
                </div>
                <div className="text-amber-500 text-sm font-medium">Hotline: 1900-SPOT</div>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-xs uppercase block">From</span>
                <span className="text-lg font-bold text-gray-900">$45<span className="text-sm font-normal text-gray-500">/person</span></span>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-6 py-2 bg-white text-gray-800 border border-gray-200 hover:border-amber-500 hover:text-amber-500 font-medium rounded-full transition-colors shadow-sm">
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Small Branch Cards Column */}
        <div className="flex flex-col gap-6">
          {/* Small Card 1 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col group h-full">
            <div className="relative h-40 w-full overflow-hidden">
              <Image 
                src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1740&auto=format&fit=crop" 
                alt="Uptown Bistro" 
                fill 
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center shadow-sm">
                 <svg className="w-3 h-3 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                 <span className="text-[10px] font-bold text-gray-800">4.8</span>
              </div>
              <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                 FULL
              </div>
            </div>
            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-amber-500 transition-colors">Uptown Bistro</h3>
                <div className="flex items-center text-gray-500 text-xs mb-3">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                  456 Oak Ave, District 3
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div>
                   <span className="text-gray-400 text-[10px] uppercase block leading-none">From</span>
                   <span className="text-sm font-bold text-gray-900 leading-none">$30<span className="text-[10px] font-normal text-gray-500">/p</span></span>
                </div>
                <button className="px-4 py-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-medium rounded-full transition-colors">
                  Waitlist
                </button>
              </div>
            </div>
          </div>

          {/* Small Card 2 */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col group h-full">
            <div className="relative h-40 w-full overflow-hidden">
              <Image 
                src="https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?q=80&w=1742&auto=format&fit=crop" 
                alt="Riverside Terrace" 
                fill 
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center shadow-sm">
                 <svg className="w-3 h-3 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                 <span className="text-[10px] font-bold text-gray-800">4.8</span>
              </div>
              <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center">
                 <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></span>
                 OPEN
              </div>
            </div>
            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-amber-500 transition-colors">Riverside Terrace</h3>
                <div className="flex items-center text-gray-500 text-xs mb-3">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                  789 River Rd, District 2
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div>
                   <span className="text-gray-400 text-[10px] uppercase block leading-none">From</span>
                   <span className="text-sm font-bold text-gray-900 leading-none">$25<span className="text-[10px] font-normal text-gray-500">/p</span></span>
                </div>
                <button className="px-4 py-1.5 bg-white text-amber-500 border border-amber-500 hover:bg-amber-50 text-xs font-medium rounded-full transition-colors">
                  Book
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
