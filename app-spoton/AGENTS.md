# 🏗️ PROJECT ARCHITECTURE — MANDATORY

> **AI agents MUST follow these rules strictly. Violation is not allowed.**
> Full rules: `./ARCHITECTURE_RULES.md`

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo SDK | 54 |
| Router | Expo Router | v6 (file-based) |
| Language | TypeScript | 5.9 |
| UI/Styling | NativeWind (Tailwind for RN) | 4.x |
| State | Zustand | 5.x |
| HTTP | Axios | 1.x |
| Real-time | Socket.IO Client | 4.8 |
| Auth | Firebase (Google) + JWT | - |
| Storage | AsyncStorage | 2.2 |
| Animation | Reanimated | 4.x |
| Navigation | React Navigation (via Expo Router) | 7.x |
| Icons | @expo/vector-icons (FontAwesome) | 15.x |
| Font | Lexend (Google Fonts) | - |

## Folder Structure

```
src/
├── app/              ← Expo Router — routing, layouts, thin screen shells ONLY
├── features/         ← ALL business logic lives here (colocated per feature)
├── components/
│   └── ui/           ← Shared reusable UI primitives (no business logic)
├── lib/              ← Shared infra (http, errors, socket, format...)
├── hooks/            ← Shared hooks only (useDebounce, useKeyboard...)
├── stores/           ← Global Zustand stores (auth, cart, socket)
├── types/            ← Global shared types only
├── constants/        ← Global constants (colors, config, enums)
└── i18n/             ← Localization (future)
```

## Feature-Based Architecture

Each feature is **fully self-contained** inside `features/<feature-name>/`:

```
features/
  <feature-name>/
    <FeatureName>Feature.tsx          ← Main screen component
    <feature-name>.service.ts         ← API calls via shared http client
    <feature-name>.types.ts           ← Feature-specific types
    <feature-name>.constants.ts       ← Feature-specific constants
    <feature-name>.store.ts           ← Feature-scoped Zustand store
    use<FeatureName>.ts               ← Feature-specific hook
    components/                       ← Feature-local sub-components
```

## Critical Rules for AI Code Generation

| Rule | Description |
|------|-------------|
| **Colocation** | Feature files stay together — NEVER spread across global folders |
| **Naming** | Screens → `PascalCase + Feature.tsx` \| Services → `feature.service.ts` |
| **`lib/`** | Only shared infra (`http.ts`, `errors.ts`, `socket.ts`) — NEVER feature logic |
| **`components/ui/`** | Only shared primitives — NEVER business logic or feature components |
| **`app/`** | Only routing + thin screen shells that extract params & render features |
| **`hooks/`** | Only shared hooks — feature hooks belong in `features/<name>/` |
| **`stores/`** | Only global stores — feature stores belong in `features/<name>/` |
| **`types/`** | Only global types — feature types belong in `features/<name>/` |
| **Cross-feature** | Features MUST NOT import from other features directly |
| **Screen components** | Keep thin: extract params → render feature components |
| **File size** | Feature files < 400 lines (extract sub-components + hooks if larger) |
| **Styling** | NativeWind `className` preferred over inline `style` |
| **State** | Zustand for global + feature state, `useState` for local component state |
| **HTTP** | ALL API calls through `lib/http.ts` — NEVER direct fetch/axios in components |
| **Errors** | NEVER empty catch blocks — always handle with AppError or Alert |

---

# 🚨 ERROR HANDLING — MANDATORY

```
API Response → lib/errors.ts (parseApiError) → AppError → Component Alert / setState
```

### Tầng 1 — lib/http.ts (tự động)
Mọi API call qua `apiClient.*` đều tự parse lỗi. KHÔNG dùng fetch/axios trực tiếp.

```ts
// ✅ Đúng
import apiClient from '@/lib/http';
const { data } = await apiClient.get('/bookings/my');

// ❌ Sai
const res = await fetch('http://10.10.100.205:5000/api/v1/bookings');
```

### Tầng 2 — Feature Service
Service chỉ gọi `apiClient.*`, không xử lý lỗi tại đây.

### Tầng 3 — Component/Hook
```tsx
try {
  await BookingService.holdBooking(payload);
  // success handling
} catch (error: any) {
  Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
}
```

---

# 📋 CHECKLIST trước khi commit

- [ ] Business logic nằm trong `features/`, KHÔNG trong `app/`
- [ ] Screen files trong `app/` chỉ extract params + render Feature component
- [ ] API calls qua `apiClient` từ `lib/http.ts`, KHÔNG fetch trực tiếp
- [ ] Error handling đầy đủ (không có catch rỗng)
- [ ] File < 400 dòng (nếu quá → tách sub-components/hooks)
- [ ] Styling dùng NativeWind `className`
- [ ] State management dùng Zustand (stores/ hoặc features/)
- [ ] TypeScript types cho props, API responses
- [ ] Import dùng `@/` path alias

---
D:\KI_7\SDN\SpotOn\app-spoton\skills-lock.json