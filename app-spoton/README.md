

# 📊 ĐÁNH GIÁ HIỆN TRẠNG DỰ ÁN (Assessment)

## Điểm mạnh ✅

| # | Điểm mạnh | Chi tiết |
|---|-----------|----------|
| 1 | **Feature-based structure** | Đã tách `features/` đúng pattern: auth, booking, branch, home, menu, customer, manager, waiter, kitchen |
| 2 | **Expo Router** | Dùng file-based routing chuẩn với `(tabs)`, `(auth)`, dynamic routes `[id]` |
| 3 | **Zustand** | Đã dùng cho auth store — nhẹ hơn Context API, phù hợp RN |
| 4 | **Role-based tabs** | `(tabs)/_layout.tsx` đã implement dynamic tab visibility theo role (Guest/Customer/Waiter/Manager/Kitchen) — rất tốt |
| 5 | **NativeWind** | Styling nhất quán, dùng Tailwind className thay vì StyleSheet |
| 6 | **Booking Flow** | Đã implement end-to-end: Date → Table → Pre-order → Confirm → Payment (5 bước) |
| 7 | **Backend reuse** | Dùng chung backend API với fe-spoton, không cần viết lại |

## Điểm yếu & Vấn đề cần sửa ⚠️

| # | Vấn đề | Mức độ | Giải pháp |
|---|--------|--------|-----------|
| 1 | **God files** | 🔴 Critical | `BookingFlowFeature.tsx` = **663 dòng**, `BranchManageFeature.tsx` = ~600 dòng, `TablesFeature.tsx` = ~580 dòng. Phải tách sub-components + hooks |
| 2 | **Thiếu types** | 🔴 Critical | Khắp nơi dùng `any` (branch, zones, tables, menu, cart items). Cần tạo proper interfaces trong `types/` |
| 3 | **Stores nhầm chỗ** | 🟡 High | `useAuthStore.ts` và `useBookingCartStore.ts` nằm trong `hooks/` thay vì `stores/` |
| 4 | **Thiếu error handling** | 🟡 High | Nhiều `catch {}` rỗng, không có `AppError` class, lỗi không được parse đúng |
| 5 | **Thiếu Socket.IO integration** | 🟡 High | Đã cài `socket.io-client` nhưng chưa implement real-time events (table changes, KDS, runner notifications) |
| 6 | **Hard-coded IP** | 🟡 High | `http://10.10.100.205:5000` hard-coded trong axios.ts. Cần dùng `EXPO_PUBLIC_API_URL` env variable |
| 7 | **Thiếu loading/empty states** | 🟡 Medium | Nhiều screen chưa có EmptyState component hoặc skeleton loading |
| 8 | **Business logic trong `(tabs)/`** | 🟡 Medium | Một số tab files có logic nặng (invoices.tsx = 10KB, kanban.tsx = 8KB, menu-manage.tsx = 11KB) thay vì delegate cho feature |
| 9 | **Cũ: Components thừa** | 🟢 Low | `EditScreenInfo.tsx`, `StyledText.tsx`, `Themed.tsx` là boilerplate cũ, cần xóa |
| 10 | **Thiếu i18n** | 🟢 Low | Tất cả text hard-coded tiếng Việt. Chưa có hệ thống localization |

---

# 🗺️ LỘ TRÌNH TRIỂN KHAI (Implementation Roadmap)

## Phase 0: Foundation & Cleanup (1-2 ngày)
> Dọn dẹp codebase, thiết lập infrastructure chuẩn

### Tasks:
- [ ] **0.1** Tạo thư mục `stores/` → Di chuyển `useAuthStore.ts`, `useBookingCartStore.ts` từ `hooks/` sang
- [ ] **0.2** Tạo `lib/http.ts` thay thế `lib/axios.ts` — thêm error parsing, response typing, AppError class
- [ ] **0.3** Tạo `lib/errors.ts` — `AppError` class với codes (NETWORK_ERROR, UNAUTHORIZED, VALIDATION_ERROR...)
- [ ] **0.4** Tạo `lib/socket.ts` — Socket.IO singleton client
- [ ] **0.5** Tạo `stores/useSocketStore.ts` — quản lý kết nối Socket
- [ ] **0.6** Tạo `lib/storage.ts` — typed AsyncStorage wrapper
- [ ] **0.7** Tạo `lib/format.ts` — formatCurrency(), formatDate(), formatTime()
- [ ] **0.8** Xóa boilerplate cũ: `EditScreenInfo.tsx`, `StyledText.tsx`, `Themed.tsx`, `useClientOnlyValue*`, `useColorScheme*`
- [ ] **0.9** Tạo `types/` files đầy đủ: `booking.types.ts`, `branch.types.ts`, `menu.types.ts`, `api.types.ts`
- [ ] **0.10** Cập nhật `constants/colors.ts` → mapping đúng với NativeWind theme
- [ ] **0.11** Tạo thêm UI primitives: `components/ui/Card.tsx`, `Badge.tsx`, `Avatar.tsx`, `EmptyState.tsx`, `LoadingOverlay.tsx`, `StatusBadge.tsx`

---

## Phase 1: Customer Core (3-5 ngày)
> Luồng Customer hoàn chỉnh — đây là actor chính của mobile app

### 1A. Auth (đã có ~70%, cần refine)
- [ ] **1.1** Refactor `LoginFeature.tsx` — thêm proper error handling, loading states
- [ ] **1.2** Refactor `RegisterFeature.tsx` — form validation (có thể dùng `react-hook-form` + `zod`)
- [ ] **1.3** Google OAuth flow — hoàn thiện `expo-auth-session` integration
- [ ] **1.4** Auto-redirect sau login dựa theo role (Customer → Home, Waiter → POS, Manager → Dashboard, Kitchen → KDS)
- [ ] **1.5** Forgot Password flow (nếu web đã có)

### 1B. Home & Browse (đã có ~60%)
- [ ] **1.6** `HomeFeature.tsx` — Featured branches, promotions, quick booking CTA
- [ ] **1.7** `CustomerExploreFeature.tsx` (branches list) — search, filter by city/district, sort
- [ ] **1.8** `BranchDetailFeature.tsx` — gallery, amenities, menu preview, "Đặt bàn" CTA
- [ ] **1.9** `MenuFeature.tsx` — public menu view by category, dietary tags filter

### 1C. Booking Flow (đã có ~80%, cần tách + fix)
- [ ] **1.10** **CRITICAL:** Tách `BookingFlowFeature.tsx` (663 dòng) thành:
  - `BookingFlowFeature.tsx` — orchestrator (< 200 dòng)
  - `components/DateTimeStep.tsx` — Step 1
  - `components/TableSelectionStep.tsx` — Step 2
  - `components/PreOrderStep.tsx` — Step 3
  - `components/ConfirmationStep.tsx` — Step 4
  - `components/PaymentStep.tsx` — Step 5
  - `useBookingFlow.ts` — hook chứa state + logic
  - `booking.types.ts` — proper interfaces
- [ ] **1.11** Integrate Socket.IO — real-time table availability
- [ ] **1.12** Deep link support — VNPay/MoMo payment return URL → app

### 1D. My Bookings & History
- [ ] **1.13** `MyBookingsFeature.tsx` — list bookings by status tabs (Upcoming, Completed, Cancelled)
- [ ] **1.14** `BookingDetailFeature.tsx` — chi tiết booking, order items, payment info
- [ ] **1.15** Cancel Booking flow — confirm dialog, refund policy display, OTP verification
- [ ] **1.16** Review / Feedback — rating + comment form (chỉ cho COMPLETED bookings)

### 1E. Profile
- [ ] **1.17** `ProfileFeature.tsx` — update info, avatar, allergies, VIP notes
- [ ] **1.18** Voucher wallet — hiển thị vouchers đã claim
- [ ] **1.19** Notification center (future)

---

## Phase 2: Staff Operations (3-5 ngày)
> Waiter POS + Kitchen Display — cho staff dùng trên điện thoại/tablet

### 2A. Waiter POS (đã có ~50%)
- [ ] **2.1** Tách `POSFeature.tsx` → sub-components
- [ ] **2.2** Walk-in booking — chọn bàn trống + tạo đơn IN_USE trực tiếp
- [ ] **2.3** Additional order — gọi thêm món cho bàn đang phục vụ
- [ ] **2.4** Mark Served — bấm SERVED cho từng món, trigger Socket event

### 2B. Waiter Runner (đã có ~50%)
- [ ] **2.5** `RunnerFeature.tsx` — danh sách món READY cần mang ra bàn
- [ ] **2.6** Socket listener: nhận event `ITEM_READY` từ Coordinator
- [ ] **2.7** Bấm SERVED → xóa khỏi danh sách + emit Socket

### 2C. Kitchen Display System (đã có ~40%)
- [ ] **2.8** `KDSFeature.tsx` — hàng đợi món cần chế biến
- [ ] **2.9** Socket listener: `NEW_KITCHEN_ORDER` khi check-in hoặc gọi thêm món
- [ ] **2.10** Mark READY — Coordinator bấm xác nhận món nấu xong
- [ ] **2.11** SLA timer — countdown theo quy tắc (xanh < 10', vàng 10-20', đỏ > 20')
- [ ] **2.12** Undo 30s — hoàn tác mark ready trong 30 giây

---

## Phase 3: Manager Dashboard (3-5 ngày)
> Quản lý chi nhánh trên mobile

### 3A. Branch Management (đã có ~50%)
- [ ] **3.1** Tách `BranchManageFeature.tsx` (600+ dòng) → sub-components
- [ ] **3.2** Check-in Kanban — danh sách booking theo trạng thái, bấm check-in
- [ ] **3.3** Table Map — sơ đồ bàn real-time (Socket)
- [ ] **3.4** Menu management — ẩn/hiện món, điều chỉnh giá

### 3B. Operations
- [ ] **3.5** Checkout flow — chốt bill, hiển thị adjustments, xác nhận thanh toán
- [ ] **3.6** Force Release — nhả bàn khi cần
- [ ] **3.7** Bill Adjustments — thêm/xóa giảm giá phát sinh
- [ ] **3.8** Refund processing — upload chứng từ, xác nhận hoàn tiền

### 3C. Analytics
- [ ] **3.9** Revenue dashboard — biểu đồ doanh thu theo ngày/ca
- [ ] **3.10** Transaction history — lịch sử giao dịch
- [ ] **3.11** Overload alert — toggle trạng thái chi nhánh OPEN/FULL/CLOSED

---

## Phase 4: Polish & Production (2-3 ngày)
> UX, performance, production readiness

- [ ] **4.1** Pull-to-refresh cho tất cả list screens
- [ ] **4.2** Skeleton loading cho data-heavy screens
- [ ] **4.3** Offline mode / Network error handling
- [ ] **4.4** Push notifications (expo-notifications)
- [ ] **4.5** Deep linking — VNPay return, share branch link
- [ ] **4.6** App icon, splash screen customization
- [ ] **4.7** EAS Build & Submit setup (iOS + Android)
- [ ] **4.8** Environment variables (.env) for staging/production
- [ ] **4.9** Performance: FlatList optimization, memo, lazy loading
- [ ] **4.10** Accessibility: proper labels, contrast ratios

---

# 📐 FEATURE-TO-SCREEN MAPPING (Web → Mobile)

> Bảng mapping từ web frontend (`fe-spoton`) sang mobile app, chỉ cho **CUSTOMER** actor (actor chính của mobile).

| Web Feature | Mobile Screen | Route | Priority |
|-------------|--------------|-------|----------|
| `home/HomePageFeature` | `HomeFeature` | `(tabs)/index` | ✅ Done |
| `public/branches` | `CustomerExploreFeature` | `(tabs)/branches` | ✅ Done |
| `public/branch-detail` | `BranchDetailFeature` | `branch/[id]` | ✅ Done |
| `public/menu` | `MenuFeature` | `menu` | ✅ Done |
| `booking/TableMapFeature` | `BookingFlowFeature` (Step 2) | `booking/[id]` | ✅ Done |
| `auth/LoginFeature` | `LoginFeature` | `(auth)/login` | ✅ Done |
| `auth/RegisterFeature` | `RegisterFeature` | `(auth)/register` | ✅ Done |
| `auth/VerifyOtpFeature` | `OtpVerificationFeature` | `(auth)/otp` | ✅ Done |
| `profile/ProfileFeature` | `ProfileFeature` | `(tabs)/profile` | ✅ Done |
| `booking/booking.service` | `BookingService` | — | ✅ Done |
| `booking/MyBookingsFeature` | `MyBookingsFeature` | `(tabs)/bookings` | ✅ Done |
| `booking/BookingDetailFeature` | `BookingDetailFeature` | `booking/detail/[id]` | ✅ Done |
| **Web-only features (không chuyển sang mobile):** | | | |
| `admin/*` | ❌ Không chuyển | — | N/A |
| `admin/map-editor` | ❌ Không chuyển | — | N/A |
| `admin/system-settings` | ❌ Không chuyển | — | N/A |

> **Nguyên tắc:** Admin Dashboard giữ nguyên trên web — quá phức tạp cho mobile. Mobile chỉ phục vụ **Customer**, **Waiter**, **Kitchen**, và **Manager** (view-only analytics).

---

# 🔌 BACKEND API REUSE MAP

> Tất cả các API endpoint đã có sẵn từ `spoton-backend`. Mobile app chỉ cần gọi, KHÔNG cần viết lại.

| Feature | API Endpoint | Method | Đã implement? |
|---------|-------------|--------|--------------|
| Auth - Login | `/api/v1/auth/login` | POST | ✅ |
| Auth - Register | `/api/v1/auth/register` | POST | ✅ |
| Auth - Google | `/api/v1/auth/google` | POST | ✅ |
| Auth - Me | `/api/v1/auth/me` | GET | ✅ |
| Auth - OTP | `/api/v1/auth/verify-otp` | POST | ✅ |
| Branches - List | `/api/v1/branches` | GET | ✅ |
| Branches - Detail | `/api/v1/branches/:id` | GET | ✅ |
| Menu - Public | `/api/v1/menus/public/:branchId` | GET | ✅ |
| Booking - Availability | `/api/v1/reception/availability` | GET | ✅ |
| Booking - Hold | `/api/v1/reception/hold` | POST | ✅ |
| Booking - Release | `/api/v1/reception/hold/:id` | DELETE | ⬜ |
| Booking - My List | `/api/v1/bookings/my` | GET | ✅ |
| Booking - Detail | `/api/v1/bookings/:id` | GET | ✅ |
| Booking - Cancel | `/api/v1/bookings/:id/cancel` | PATCH | ⬜ |
| Payment - Calculate | `/api/v1/payment/calculate-deposit` | POST | ⬜ |
| Payment - Create | `/api/v1/payment/create-payment` | POST | ✅ |
| Payment - Mock | `/api/v1/payment/mock-payment` | POST | ✅ |
| Orders - Additional | `/api/v1/orders/additional` | POST | ⬜ |
| Check-in | `/api/v1/reception/bookings/:id/check-in` | PATCH | ⬜ |
| Checkout | `/api/v1/reception/bookings/:id/checkout` | PATCH | ⬜ |
| Force Release | `/api/v1/reception/bookings/:id/force-release` | PATCH | ⬜ |
| Walk-in | `/api/v1/reception/walk-in` | POST | ⬜ |
| Refund | `/api/v1/reception/bookings/:id/refund` | POST | ⬜ |
| Profile - Update | `/api/v1/users/me` | PUT | ⬜ |
| Vouchers | `/api/v1/vouchers` | GET | ⬜ |
| Feedback | `/api/v1/bookings/:id/feedback` | POST | ⬜ |
| KDS - Orders | `/api/v1/orders/kitchen/:branchId` | GET | ⬜ |
| KDS - Update Status | `/api/v1/orders/:id/status` | PATCH | ⬜ |

---

# 🔄 SOCKET.IO EVENTS CẦN IMPLEMENT

| Event | Hướng | Screens | Mô tả |
|-------|-------|---------|-------|
| `table_status_changed` | Server → Client | BookingFlow, POS, TableMap | Bàn đổi trạng thái real-time |
| `BOOKING_STATUS_CHANGED` | Server → Client | Manager Kanban, MyBookings | Booking đổi trạng thái |
| `NEW_KITCHEN_ORDER` | Server → Client | KDS | Món ăn mới cần chế biến |
| `ACTIVATE_IPAD` | Server → Client | (N/A — iPad only) | — |
| `RESET_IPAD` | Server → Client | (N/A — iPad only) | — |
| `BOOKING_UPDATED` | Server → Client | Manager, Invoices | Booking có thay đổi |
| `join_branch_room` | Client → Server | All staff screens | Tham gia phòng chi nhánh |

---

# 💡 GÓP Ý KỸ THUẬT (Technical Recommendations)

## Nên làm ngay:

1. **Tách God files** — `BookingFlowFeature.tsx`, `BranchManageFeature.tsx`, `TablesFeature.tsx` đều > 500 dòng. Tách thành sub-components + custom hooks
2. **Thêm proper TypeScript types** — loại bỏ `any` typing, tạo interfaces đầy đủ từ backend schema
3. **Di chuyển stores** — `hooks/useAuthStore.ts` → `stores/useAuthStore.ts`
4. **Tạo AppError class** — centralized error handling thay vì `catch {}` rỗng
5. **Environment variables** — `.env` file thay vì hard-coded IP addresses

## Nên cân nhắc:

6. **TanStack Query (React Query)** — thay thế manual `useState` + `useEffect` cho API calls → tự động caching, refetching, stale detection
7. **react-hook-form + zod** — form validation nhất quán cho auth/booking forms
8. **expo-notifications** — push notifications cho booking reminders, kitchen alerts
9. **Haptic feedback** — `expo-haptics` cho các action buttons (Mark Served, Check-in)
10. **Biometric auth** — Face ID/Touch ID cho staff login nhanh

## Không nên chuyển sang mobile:

- **Admin Dashboard** — quá phức tạp, giữ trên web
- **Map Editor** — kéo thả bàn không phù hợp mobile
- **System Settings** — cấu hình hệ thống thuộc web admin
- **Master Menu Management** — CRUD phức tạp, giữ trên web

---

> 📖 Xem chi tiết architecture rules tại: `./ARCHITECTURE_RULES.md`