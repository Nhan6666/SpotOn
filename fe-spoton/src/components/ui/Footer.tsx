import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Mô tả */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold tracking-tight text-gray-900">Spot<span className="text-amber-500">On</span></span>
            </Link>
            <p className="text-gray-500 text-sm mb-6 max-w-sm leading-relaxed">
              Giải pháp quản lý đặt bàn và chăm sóc khách hàng toàn diện dành cho nhà hàng cao cấp.
            </p>
            <div className="flex gap-4">
              {/* Social icons can be added here */}
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-500 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
            </div>
          </div>

          {/* Về chúng tôi */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Khám Phá</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="#" className="text-sm text-gray-500 hover:text-amber-500 transition-colors">Về SpotOn</Link></li>
              <li><Link href="#" className="text-sm text-gray-500 hover:text-amber-500 transition-colors">Chi Nhánh</Link></li>
              <li><Link href="#" className="text-sm text-gray-500 hover:text-amber-500 transition-colors">Thực Đơn</Link></li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Hỗ Trợ</h4>
            <ul className="flex flex-col gap-3">
              <li><Link href="#" className="text-sm text-gray-500 hover:text-amber-500 transition-colors">Trung Tâm Trợ Giúp</Link></li>
              <li><Link href="#" className="text-sm text-gray-500 hover:text-amber-500 transition-colors">Bảo Mật</Link></li>
              <li><Link href="#" className="text-sm text-gray-500 hover:text-amber-500 transition-colors">Điều Khoản</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-100 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} SpotOn. Đã đăng ký bản quyền.</p>
          <p className="mt-2 md:mt-0">Thiết kế bởi SpotOn Team</p>
        </div>
      </div>
    </footer>
  );
}
