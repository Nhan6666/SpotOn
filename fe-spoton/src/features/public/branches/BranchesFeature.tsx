import Link from 'next/link';
import Image from 'next/image';

const mockBranches = [
  {
    id: '1',
    name: 'SpotOn Downtown Prime',
    rating: 4.9,
    isPopular: true,
    description: 'Modern Vietnamese fusion with an unparalleled skyline view. Perfect for business lunches and elegant evening dinners.',
    capacity: '150 guests',
    area: '450 sqm',
    floors: '2 Floors | Rooftop',
    district: 'District 1',
    amenities: ['Private Rooms', 'Valet'],
    image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1934&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'SpotOn Riverside Oasis',
    rating: 4.7,
    isPopular: false,
    description: 'Expansive garden dining right by the river. Ideal for large gatherings, casual family dinners, and enjoying the breeze.',
    capacity: '220 guests',
    area: '800 sqm',
    floors: 'Main Hall & Garden',
    district: 'District 2',
    amenities: ['Outdoor', 'Pet Friendly'],
    image: 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?q=80&w=1934&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'SpotOn Heritage House',
    rating: 4.8,
    isPopular: false,
    description: 'Intimate dining experience housed in a beautifully restored colonial villa. Featuring exclusive private dining rooms.',
    capacity: '80 guests',
    area: '300 sqm',
    floors: '1 Floor | Private Rms',
    district: 'District 3',
    amenities: ['Air Conditioned', 'Wine Cellar'],
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1934&auto=format&fit=crop'
  }
];

export function BranchesFeature() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900 font-medium">Branches in Ho Chi Minh City</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">12 Branches Found</h1>
          <p className="text-gray-500">Showing available SpotOn locations matching your criteria.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center font-bold text-gray-800">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                  Filters
                </div>
                <button className="text-sm text-[#ea580c] hover:underline font-medium">Clear All</button>
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Location / District</label>
                <div className="relative">
                  <select className="w-full border border-gray-300 rounded-lg py-2.5 px-3 appearance-none bg-gray-50 text-gray-700 outline-none focus:border-[#ea580c]">
                    <option>All Districts</option>
                    <option>District 1</option>
                    <option>District 2</option>
                    <option>District 3</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Event Size */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Size / Guests</label>
                <div className="flex items-center justify-between border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <button className="px-4 py-2 text-gray-500 hover:bg-gray-200 transition-colors font-medium">─</button>
                  <span className="font-semibold text-gray-800">20+</span>
                  <button className="px-4 py-2 text-gray-500 hover:bg-gray-200 transition-colors font-medium">+</button>
                </div>
              </div>

              {/* Tables Required */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Tables Required</label>
                <input type="number" placeholder="e.g. 5" className="w-full border border-gray-300 rounded-lg py-2.5 px-3 bg-gray-50 text-gray-700 outline-none focus:border-[#ea580c] placeholder-gray-400" />
              </div>

              {/* Area Preferences */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Area Preferences</label>
                <div className="space-y-3">
                  {['Air Conditioned', 'Garden / Outdoor', 'Private Room', 'Smoking Area'].map((item) => (
                    <label key={item} className="flex items-center cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5 mr-3 border border-gray-300 rounded-md bg-white group-hover:border-[#ea580c] transition-colors">
                        <input type="checkbox" className="opacity-0 absolute w-full h-full cursor-pointer" />
                        <svg className="w-3 h-3 text-[#ea580c] hidden checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span className="text-sm text-gray-600">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold py-3 rounded-lg transition-colors shadow-sm mt-2">
                Apply Filters
              </button>
              
              <style>{`
                input[type="checkbox"]:checked + .checkmark {
                  display: block;
                }
                input[type="checkbox"]:checked ~ div {
                  border-color: #ea580c;
                  background-color: #fffaf5;
                }
              `}</style>
            </div>
          </div>

          {/* List of Branches */}
          <div className="w-full lg:w-3/4 flex flex-col gap-6">
            {mockBranches.map((branch) => (
              <div key={branch.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow group">
                
                {/* Image Section */}
                <div className="w-full md:w-5/12 h-56 md:h-auto relative overflow-hidden flex-shrink-0">
                  <Image 
                    src={branch.image}
                    alt={branch.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {branch.isPopular && (
                    <div className="absolute top-4 left-4 bg-[#ea580c] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm z-10">
                      Popular
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="w-full md:w-7/12 p-5 lg:p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{branch.name}</h2>
                    <div className="flex items-center bg-[#fff8eb] px-2 py-1 rounded text-sm text-[#f59e0b] font-bold ml-2 shrink-0">
                      <svg className="w-4 h-4 mr-1 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                      {branch.rating}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-5 line-clamp-2">
                    {branch.description}
                  </p>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-5">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-[#ea580c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                      <span className="truncate">Capacity: {branch.capacity}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-[#ea580c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                      <span className="truncate">Area: {branch.area}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-[#ea580c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                      <span className="truncate">{branch.floors}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-[#ea580c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      <span className="truncate">{branch.district}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {branch.amenities.map(amenity => (
                        <span key={amenity} className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2.5 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                    
                    <Link href={`/branches/${branch.id}`} className="w-full sm:w-auto px-6 py-2.5 border-2 border-[#ea580c] text-[#ea580c] hover:bg-[#fff6f0] font-bold rounded-full text-sm transition-colors text-center shrink-0">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-4 flex justify-center">
              <button className="px-8 py-3 border border-gray-300 text-gray-700 font-bold rounded-full text-sm hover:bg-gray-50 transition-colors flex items-center bg-white shadow-sm">
                Load More Branches
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
