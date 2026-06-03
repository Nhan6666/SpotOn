import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-amber-500 font-playfair tracking-tight">SpotOn</span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-amber-500 border-b-2 border-amber-500 pb-1">
            Home
          </Link>
          <Link href="/branches" className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors pb-1 border-b-2 border-transparent hover:border-amber-500">
            Branches
          </Link>
          <Link href="/menu" className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors pb-1 border-b-2 border-transparent hover:border-amber-500">
            Menu
          </Link>
          <Link href="/catering" className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors pb-1 border-b-2 border-transparent hover:border-amber-500">
            Catering
          </Link>
          <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-amber-500 transition-colors pb-1 border-b-2 border-transparent hover:border-amber-500">
            About Us
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-100">
            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-32" />
          </div>
          
          <Link href="/login" className="text-sm font-medium text-amber-500 hover:text-amber-600 transition-colors hidden sm:block">
            Login
          </Link>
          
          <Link href="/book" className="hidden sm:flex items-center justify-center px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-full transition-colors">
            Book a Table
          </Link>

          <button className="w-8 h-8 rounded-full bg-emerald-700 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
             <div className="w-full h-full bg-emerald-600 relative">
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold text-[10px]">VN</div>
             </div>
          </button>
        </div>
      </div>
    </header>
  );
}
