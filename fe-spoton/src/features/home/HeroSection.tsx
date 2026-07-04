import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="relative w-full h-[600px] mb-24">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Image
          src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1934&auto=format&fit=crop"
          alt="Restaurant interior"
          fill
          sizes="100vw"
          className="object-cover brightness-50"
          priority
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center pt-24 pb-32 px-4 container mx-auto h-full">
        {/* Overlay Block */}
        <div 
          className="bg-[#f5f5f5] bg-opacity-95 backdrop-blur-sm rounded-2xl p-10 md:p-14 text-center max-w-4xl shadow-xl w-full mx-4 animate-fadeInUp"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-playfair tracking-tight">
            Trải Nghiệm Ẩm Thực Đỉnh Cao Tại<br />SpotOn
          </h1>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">
            Enterprise-grade reservation and catering management for the discerning diner and the efficient operator.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-full transition-colors shadow-md">
              Đặt Bàn Ngay
            </button>
            <button className="px-8 py-3 bg-white hover:bg-gray-50 text-amber-500 font-medium rounded-full transition-colors shadow-sm border border-amber-500">
              View Menu
            </button>
          </div>
        </div>
      </div>

      {/* Search/Filter Bar */}
      <div className="absolute left-0 right-0 z-20 flex justify-center -bottom-10 px-4">
        <div className="bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-2 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-gray-100 border border-gray-50 animate-fadeInUp delay-100 max-w-5xl w-full">
          
          {/* LOCATION */}
          <div className="flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-gray-50 rounded-full transition-colors cursor-pointer group">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#ef5914] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <div className="ml-3 flex flex-col flex-1 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide">Location</span>
              <input type="text" placeholder="Where are you going?" className="w-full bg-transparent outline-none text-gray-500 font-medium text-sm md:text-base placeholder-gray-400 group-hover:placeholder-gray-500 truncate mt-0.5" />
            </div>
          </div>
          
          {/* DATE */}
          <div className="flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-gray-50 rounded-full transition-colors cursor-pointer group">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#ef5914] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <div className="ml-3 flex flex-col flex-1 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide">Date</span>
              <input type="text" placeholder="Select Date" className="w-full bg-transparent outline-none text-gray-500 font-medium text-sm md:text-base placeholder-gray-400 group-hover:placeholder-gray-500 truncate mt-0.5" />
            </div>
          </div>

          {/* TIME */}
          <div className="flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-gray-50 rounded-full transition-colors cursor-pointer group">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#ef5914] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div className="ml-3 flex flex-col flex-1 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide">Time</span>
              <input type="text" placeholder="Add Time" className="w-full bg-transparent outline-none text-gray-500 font-medium text-sm md:text-base placeholder-gray-400 group-hover:placeholder-gray-500 truncate mt-0.5" />
            </div>
          </div>

          {/* GUESTS */}
          <div className="flex items-center flex-1 px-4 md:px-6 py-3 md:py-1 w-full hover:bg-gray-50 rounded-full transition-colors cursor-pointer group">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#ef5914] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            <div className="ml-3 flex flex-col flex-1 overflow-hidden">
              <span className="text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide">Guests</span>
              <input type="text" placeholder="2 Guests" className="w-full bg-transparent outline-none text-gray-500 font-medium text-sm md:text-base placeholder-gray-400 group-hover:placeholder-gray-500 truncate mt-0.5" />
            </div>
          </div>

          {/* SEARCH BUTTON */}
          <div className="p-1.5 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
            <button className="w-full md:w-auto px-8 py-3.5 bg-[#ef5914] hover:bg-[#d44e11] text-white font-bold rounded-full transition-colors flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
