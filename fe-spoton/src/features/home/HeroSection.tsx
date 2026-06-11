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
      <div className="absolute left-0 right-0 z-20 container mx-auto px-4 -bottom-8">
        <div 
          className="bg-white rounded-xl shadow-lg p-4 flex flex-col md:flex-row items-center gap-4 border border-gray-100 animate-fadeInUp delay-100"
        >
          <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-gray-200 pb-3 md:pb-0 md:pr-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Khu vực</label>
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <select className="w-full bg-transparent outline-none cursor-pointer appearance-none">
                <option>All Locations</option>
                <option>District 1</option>
                <option>District 3</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-gray-200 pb-3 md:pb-0 md:pr-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Loại hình</label>
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"></path></svg>
              <select className="w-full bg-transparent outline-none cursor-pointer appearance-none">
                <option>Dine-in</option>
                <option>Catering</option>
              </select>
            </div>
          </div>

          <div className="flex-[1.5] w-full pb-3 md:pb-0 md:pr-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Thời gian</label>
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <input type="datetime-local" className="w-full bg-transparent outline-none text-gray-600" />
            </div>
          </div>

          <div className="w-full md:w-auto">
            <button className="w-full md:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              Search
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
