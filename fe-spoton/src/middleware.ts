import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lấy token và role từ cookie (đã được set bởi AuthProvider / LoginFeature)
  const token = request.cookies.get('spoton_token')?.value;
  const role = request.cookies.get('spoton_role')?.value;

  // 1. Chặn người dùng chưa đăng nhập vào các trang yêu cầu đăng nhập
  const protectedRoutes = ['/profile', '/my-bookings', '/manager', '/admin', '/waiter'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Phân quyền theo Role (Chỉ khi đã đăng nhập)
  if (token && role) {
    // ADMIN routes
    if (pathname.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url)); // Không đủ quyền đá về trang chủ
    }

    // MANAGER routes (Cả ADMIN và MANAGER đều vào được)
    if (pathname.startsWith('/manager') && !['ADMIN', 'MANAGER'].includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // WAITER routes (Cả ADMIN, MANAGER, WAITER đều vào được)
    if (pathname.startsWith('/waiter') && !['ADMIN', 'MANAGER', 'WAITER'].includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Cấu hình Middleware chỉ chạy trên một số route nhất định (tối ưu hiệu suất)
export const config = {
  matcher: [
    '/profile/:path*',
    '/my-bookings/:path*',
    '/manager/:path*',
    '/admin/:path*',
    '/waiter/:path*',
  ],
};
