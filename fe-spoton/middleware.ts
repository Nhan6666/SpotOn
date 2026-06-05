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
  { path: '/manager', roles: ['MANAGER', 'ADMIN'] },
];

// Route chỉ dành cho người chưa đăng nhập
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

    // Đã có token nhưng không đủ quyền → redirect về trang 403
    if (userRole && !protectedRoute.roles.includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

// Cấu hình: Middleware chỉ chạy trên các route này (bỏ qua static files, api proxy...)
export const config = {
  matcher: [
    /*
     * Match tất cả route NGOẠI TRỪ:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     * - api (proxy routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
