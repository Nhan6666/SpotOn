import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =============================================
// AUTH GUARD - Phân quyền theo Route
// Bật/tắt tại đây khi chưa làm xong Login
// =============================================
const IS_AUTH_ENABLED = true; // ← Đổi thành FALSE khi cần tắt tạm

// Định nghĩa các route cần bảo vệ và role tương ứng
const PROTECTED_ROUTES: { path: string; roles: string[] }[] = [
  { path: '/admin', roles: ['ADMIN'] },
  { path: '/kitchen', roles: ['KITCHEN'] },
  { path: '/manager', roles: ['MANAGER'] },
  { path: '/waiter', roles: ['WAITER'] },
  { path: '/profile', roles: ['CUSTOMER'] },
  { path: '/my-bookings', roles: ['CUSTOMER'] },
];

// Route chỉ dành cho người chưa đăng nhập
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] pathname: ${pathname}`);

  // ---- Nếu Auth chưa bật, bỏ qua tất cả ----
  if (!IS_AUTH_ENABLED) {
    return NextResponse.next();
  }

  // ---- Lấy token & thông tin user từ cookie ----
  const token = request.cookies.get('spoton_token')?.value;
  const userRole = request.cookies.get('spoton_role')?.value;

  // ---- Chặn người đã đăng nhập vào trang Login/Register ----
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && token) {
    // Đã có token → redirect về trang chủ
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ---- Chặn người chưa đăng nhập vào trang được bảo vệ ----
  const protectedRoute = PROTECTED_ROUTES.find((route) =>
    pathname.startsWith(route.path)
  );

  if (protectedRoute) {
    // Chưa có token → redirect về trang Login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname); // Lưu lại URL gốc để sau login redirect về
      return NextResponse.redirect(loginUrl);
    }

    // Đã có token nhưng không đủ quyền hoặc bị mất role trong cookie
    if (!userRole || !protectedRoute.roles.includes(userRole.toUpperCase())) {
      // Nếu MANAGER truy cập /admin → chuyển sang /manager tương ứng
      if (pathname.startsWith('/admin') && userRole?.toUpperCase() === 'MANAGER') {
        const newPath = pathname.replace('/admin', '/manager');
        return NextResponse.redirect(new URL(newPath, request.url));
      }
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

// Cấu hình: Middleware chạy trên tất cả các route, trừ API và Next.js static files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
