# 📱 SpotOn Mobile — Architecture Rules (React Native / Expo)

This project follows a **feature-based architecture** mirroring the web frontend (`fe-spoton`),
adapted for **React Native** with **Expo SDK 54**, **Expo Router v6**, **NativeWind**, and **Zustand**.

AI agents and all contributors must strictly follow these rules when generating or modifying code.

---

# 1. Folder Structure

```
src/
├── app/              ← Expo Router — file-based routing, layouts, screen shells ONLY
├── features/         ← ALL business logic (colocated per feature module)
├── components/
│   └── ui/           ← Shared reusable UI primitives only (no business logic)
├── lib/              ← Shared utilities & infrastructure (http, errors, socket, format...)
├── hooks/            ← Shared hooks only (useDebounce, useKeyboard...)
├── stores/           ← Global Zustand stores (auth, cart, socket...)
├── types/            ← Global shared TypeScript types only
├── constants/        ← Global constants (colors, config, enums...)
└── assets/           ← Images, fonts (aliased from root)
```

---

# 2. Feature-Based Architecture

All business logic must live inside the `features` directory.

Each feature folder contains ALL files related to that feature:

```
features/
  <feature-name>/
    <FeatureName>Feature.tsx          ← Main feature screen/component
    <feature-name>.service.ts         ← API calls & data transformation
    <feature-name>.types.ts           ← Feature-specific types/interfaces
    <feature-name>.constants.ts       ← Feature-specific constants
    <feature-name>.store.ts           ← Feature-specific Zustand store (if needed)
    use<FeatureName>.ts               ← Feature-specific hook
    components/                       ← Feature-local sub-components
      <SubComponent>.tsx
```

Each feature must contain all related logic — do NOT split it across global folders.

---

# 3. Colocation Rule

Files that belong to the same feature must be colocated in the same folder.

DO NOT spread feature logic across multiple global folders.

**Incorrect:**
```
components/<FeatureName>Component.tsx
services/<featureName>Service.ts
types/<featureName>.ts
hooks/use<FeatureName>.ts
```

**Correct:**
```
features/<feature-name>/
  <FeatureName>Feature.tsx
  <feature-name>.service.ts
  <feature-name>.types.ts
  use<FeatureName>.ts
```

---

# 4. Features Directory Rules

Each feature folder may contain:

- UI components (`.tsx`)
- Services (`.service.ts`) — API calls via shared `http` client
- Zustand stores (`.store.ts`) — feature-scoped state
- Hooks (`use<Name>.ts`)
- Types (`.types.ts`)
- Constants (`.constants.ts`)
- Sub-components folder (`components/`)

---

# 5. Shared UI Components

Reusable UI components that are NOT tied to any specific feature must go in:

```
components/ui/
  Button.tsx
  Input.tsx
  Card.tsx
  Badge.tsx
  Modal.tsx
  Avatar.tsx
  EmptyState.tsx
  LoadingOverlay.tsx
  StatusBadge.tsx
```

These components must NOT contain business logic.

They must accept props for customization and use NativeWind for styling.

---

# 6. Feature Components

Components tied to a specific feature must stay inside that feature folder.

**Correct:** `features/<feature-name>/<FeatureName>Feature.tsx`

**Incorrect:** `components/<FeatureName>Component.tsx`

If a feature has complex sub-components, use a local `components/` directory:

```
features/booking/
  BookingFlowFeature.tsx
  components/
    StepIndicator.tsx
    TableGrid.tsx
    TimeSlotPicker.tsx
    CartSummary.tsx
```

---

# 7. Lib Directory

The `lib` directory is only for shared utilities and infrastructure code.

**Allowed:**
```
lib/
  http.ts              ← Axios instance with interceptors (shared HTTP client)
  errors.ts            ← AppError class & error parsing utilities
  socket.ts            ← Socket.IO client singleton
  firebase.ts          ← Firebase config
  format.ts            ← Date/currency/phone formatting helpers
  storage.ts           ← AsyncStorage wrapper with typed keys
  linking.ts           ← Deep linking & external URL helpers
```

**Not allowed:**
```
lib/<feature-name>.ts    ← Feature logic belongs in features/
```

Feature logic must never be placed in `lib`.

---

# 8. Hooks

Shared hooks that are reusable across features go in:

```
hooks/
  useDebounce.ts
  useKeyboard.ts
  useRefreshControl.ts
  useNetworkStatus.ts
  useAppState.ts
```

Feature-specific hooks must stay inside the feature folder:

```
features/<feature-name>/use<FeatureName>.ts
```

---

# 9. Stores (Zustand)

Global Zustand stores that are shared across features go in:

```
stores/
  useAuthStore.ts        ← Auth state: user, token, login/logout
  useSocketStore.ts      ← Socket.IO connection & events
  useCartStore.ts        ← Booking cart (pre-selected items)
  useNotificationStore.ts
```

Feature-specific stores stay inside the feature folder:

```
features/<feature-name>/<feature-name>.store.ts
```

### Store Rules:
- All stores use the `use<Name>Store` naming convention
- Persist stores with `AsyncStorage` when session survival is needed
- NEVER put API calls directly in stores — delegate to service files
- Keep stores thin — only state + simple actions

---

# 10. Types

Shared global types go in:

```
types/
  api.types.ts         ← API response wrapper types
  user.types.ts        ← User, Role types
  booking.types.ts     ← Booking, OrderItem, PaymentInfo types
  branch.types.ts      ← Branch, Zone, Table types
  menu.types.ts        ← Menu, MenuItem types
  navigation.types.ts  ← Typed route params
```

Feature-specific types must stay inside the feature folder:

```
features/<feature-name>/<feature-name>.types.ts
```

---

# 11. Constants

Global constants go in:

```
constants/
  colors.ts            ← Design system colors (must match NativeWind theme)
  config.ts            ← API_URL, timeouts, feature flags
  enums.ts             ← Shared enums (BookingStatus, TableStatus, Role...)
```

Feature constants stay inside the feature folder:

```
features/<feature-name>/<feature-name>.constants.ts
```

---

# 12. Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Feature screens | PascalCase + `Feature` suffix | `BookingFlowFeature.tsx` |
| Sub-components | PascalCase | `TableGrid.tsx` |
| Services | dot notation | `booking.service.ts` |
| Types | dot notation | `booking.types.ts` |
| Constants | dot notation | `booking.constants.ts` |
| Zustand stores | camelCase with `use` + `Store` | `useAuthStore.ts` |
| Hooks | camelCase with `use` prefix | `useBookingFlow.ts` |
| Feature folders | kebab-case | `booking-flow/` |
| Route files | kebab-case (Expo Router) | `branch-manage.tsx` |

---

# 13. Import Rules

Use `@/` path alias for absolute imports (configured in `tsconfig.json`):

```ts
// ✅ Good — absolute imports
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { http } from '@/lib/http';
import { BookingService } from './booking.service';

// ❌ Bad — deep relative imports
import { Button } from '../../../components/ui/Button';

// ❌ Bad — cross-feature import
import { UserType } from '../other-feature/other.types';
```

Prefer local (relative) imports within the same feature folder.

Avoid deep cross-feature imports.

---

# 14. Dependency Rules

Features must NOT depend directly on other features.

If sharing logic is required, extract to:

```
lib/          ← Utility functions
hooks/        ← Shared hooks
stores/       ← Global stores
components/ui/ ← Shared UI primitives
types/        ← Global types
```

---

# 15. App Directory (Expo Router)

The `app/` directory must only contain:

- Route files (screen shells)
- Layout files (`_layout.tsx`)
- Route groups `(group-name)/`
- Dynamic routes `[param].tsx`
- Error/not-found screens (`+not-found.tsx`)

**Business logic must NOT be placed here.**

Screen files should be **thin** — they import and render feature components:

```tsx
// app/booking/[id].tsx  ← thin screen
import { BookingFlowFeature } from '@/features/booking/BookingFlowFeature';
import { useLocalSearchParams } from 'expo-router';

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookingFlowFeature branchId={id!} />;
}
```

---

# 16. Screen Components (Thin Screens)

Screen components should remain thin. They should:

- Extract route params
- Render feature components
- Optionally wrap with SafeAreaView or layout wrappers

Do NOT write business logic, state management, or API calls inside route files.

---

# 17. Styling Rules (NativeWind)

- Use **NativeWind** (Tailwind CSS for React Native) as the primary styling method
- Define custom theme tokens in `tailwind.config.js` for colors, fonts
- Keep design tokens consistent with the web app design system
- Avoid inline `style={{}}` props — prefer NativeWind className
- Exception: dynamic styles (animations, computed values) may use `style` prop

```tsx
// ✅ Good — NativeWind
<View className="flex-1 bg-background px-4 py-6">
  <Text className="font-lexend font-bold text-lg text-text">Title</Text>
</View>

// ❌ Bad — inline styles
<View style={{ flex: 1, backgroundColor: '#faf8f5', padding: 16 }}>
```

---

# 18. State Management Rules

| Scope | Tool | Location |
|-------|------|----------|
| Global (auth, socket, cart) | Zustand | `stores/` |
| Feature-scoped persistent state | Zustand | `features/<name>/<name>.store.ts` |
| Component-local state | `useState` / `useReducer` | Inside component |
| Server state (API data) | Service + `useState` in hook | `features/<name>/use<Name>.ts` |

### Future consideration:
- Consider **TanStack Query (React Query)** for server state caching once the app scales

---

# 19. API Communication Rules

### Rule: ALL API calls must go through the shared HTTP client

```ts
// ✅ Good — use shared apiClient from lib/
import apiClient from '@/lib/http';

export const BookingService = {
  getMyBookings: () => apiClient.get('/bookings/my'),
  holdBooking: (data: HoldPayload) => apiClient.post('/reception/hold', data),
};

// ❌ Bad — direct fetch/axios in component
const res = await fetch('http://localhost:5000/api/v1/bookings');
```

### HTTP Client (`lib/http.ts`) must provide:
- Auto-inject Bearer token from AsyncStorage
- Request/response logging (dev only)
- Centralized error handling → `AppError`
- Response type generics

---

# 20. Error Handling Rules

```
API Response → lib/errors.ts (parseApiError) → AppError → Component setState / Alert
```

### Error display patterns:
```tsx
// Form errors → inline Text
<Text className="text-xs text-red-500 mt-1">{error}</Text>

// Global errors → Alert.alert()
Alert.alert('Lỗi', error.message);

// Network errors → Full-screen retry
<EmptyState icon="wifi-off" message="Mất kết nối" onRetry={refetch} />
```

### NEVER:
- Use empty `catch {}` blocks
- Use `console.error` as the only error handling
- Show raw error messages to users

---

# 21. Navigation Architecture

```
app/
├── _layout.tsx               ← Root Stack (fonts, theme, splash)
├── (auth)/                   ← Auth Stack (unauthenticated)
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── otp.tsx
├── (tabs)/                   ← Main Tab Navigator (role-based tabs)
│   ├── _layout.tsx           ← Dynamic tabs by user role
│   ├── index.tsx             ← Home (GUEST/CUSTOMER)
│   ├── branches.tsx          ← Explore branches (GUEST/CUSTOMER)
│   ├── bookings.tsx          ← My bookings (CUSTOMER)
│   ├── pos.tsx               ← POS (WAITER)
│   ├── runner.tsx            ← Runner (WAITER)
│   ├── tables.tsx            ← Table map (MANAGER)
│   ├── orders.tsx            ← Orders (MANAGER)
│   ├── kds.tsx               ← Kitchen Display (KITCHEN)
│   └── profile.tsx           ← Account (ALL)
├── branch/[id].tsx           ← Branch detail (Stack screen)
├── booking/[id].tsx          ← Booking flow (Stack screen)
└── booking/detail/[id].tsx   ← Booking detail (Stack screen)
```

### Tab visibility is role-based:
- `href: null` hides tabs not assigned to current user's role
- Guest users see: Home, Branches, Profile (login prompt)
- CUSTOMER sees: Home, Branches, My Bookings, Profile
- WAITER sees: POS, Runner, Profile
- MANAGER/ADMIN sees: Branch Manage, Tables, Orders, Profile
- KITCHEN sees: KDS, Profile

---

# 22. Avoid God Files

Files should not exceed reasonable size.

**Recommended maximum:** Screen/Feature files < **400 lines** (mobile components tend to be larger than web)

If a file grows too large, extract:
1. Sub-components → `components/` subfolder
2. Business logic → custom hooks (`use<Name>.ts`)
3. API calls → service file (`.service.ts`)

---

# 23. Real-time (Socket.IO) Rules

- Socket.IO client must be a singleton in `lib/socket.ts`
- Connection management in `stores/useSocketStore.ts`
- Feature-specific event listeners in feature hooks
- Always clean up listeners in `useEffect` return

```ts
// ✅ Good
useEffect(() => {
  const socket = getSocket();
  socket.on('table_status_changed', handleTableUpdate);
  return () => { socket.off('table_status_changed', handleTableUpdate); };
}, []);
```

---

# 24. Code Organization Priority

When creating new code, follow this priority:

1. Check if it belongs to a feature → place inside `features/<name>/`
2. If reusable across features → move to `components/ui/`, `lib/`, `hooks/`, or `stores/`
3. If global state → place in `stores/`
4. Never place feature logic in `lib/`
5. Never place feature components in `components/ui/`
6. Never write business logic in `app/` route files

---

# 25. AI Agent Instructions

When generating code:

- **Always** follow these architecture rules
- **Prefer** feature-based structure — colocate everything in `features/<name>/`
- **Never** place feature logic in `lib/`
- **Never** place feature components in `components/ui/`
- **Never** write business logic inside `app/` screen files
- **Always** keep screen components thin
- **Always** follow naming conventions in Rule #12
- **Always** use NativeWind for styling
- **Always** use Zustand for state management (not Context API)
- **Always** use `@/` path alias for imports
- **Always** handle errors properly (no empty catch blocks)
- **Always** type API responses and component props

Violation of these rules is not allowed.
