export function WhyChooseSpotOn() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 font-playfair tracking-tight">Why Choose SpotOn</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Experience seamless dining reservations and catering management with our premium services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-50 transition-transform duration-300 hover:-translate-y-2">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Quick Booking</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Reserve your table in seconds with our streamlined booking process.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-50 transition-transform duration-300 hover:-translate-y-2">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Real-time Status</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Know instantly if a branch is full or open, preventing any wasted trips.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-50 transition-transform duration-300 hover:-translate-y-2">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-6 text-amber-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Premium Catering</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Elevate your events with our top-tier catering management options.
          </p>
        </div>
      </div>
    </section>
  );
}
