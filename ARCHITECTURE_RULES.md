# Frontend Architecture Rules

This project follows a **feature-based architecture** for scalability and maintainability.

AI agents must strictly follow these rules when generating code.

---

# 1. Folder Structure

The project must follow this structure:

```
src/
├── app/            ← Routing, layouts, page components ONLY
├── features/       ← ALL business logic (colocated per feature)
├── components/
│   └── ui/         ← Shared reusable UI primitives only
├── lib/            ← Shared utilities & infrastructure
├── hooks/          ← Shared hooks only
├── types/          ← Global shared types only
└── contexts/       ← Global contexts only
```

---

# 2. Feature-based Architecture

All business logic must live inside the `features` directory.

Each feature folder contains all files related to that feature:

```
features/
  <feature-name>/
    <FeatureName>Component.tsx
    <feature-name>.service.ts
    <feature-name>.types.ts
    <feature-name>.constants.ts
    <feature-name>.context.tsx
    use<FeatureName>.ts
```

Each feature must contain all related logic — do not split it across global folders.

---

# 3. Colocation Rule

Files that belong to the same feature must be colocated in the same folder.

DO NOT spread feature logic across multiple global folders.

**Incorrect:**
```
components/<FeatureName>Component.tsx
services/<featureName>Service.ts
types/<featureName>.ts
```

**Correct:**
```
features/<feature-name>/
  <FeatureName>Component.tsx
  <feature-name>.service.ts
  <feature-name>.types.ts
```

---

# 4. Features Directory Rules

Each feature folder may contain:

- UI components (`.tsx`)
- services (`.service.ts`)
- contexts (`.context.tsx`)
- hooks (`use<Name>.ts`)
- types (`.types.ts`)
- constants (`.constants.ts`)

---

# 5. Shared UI Components

Reusable UI components that are NOT tied to any specific feature must go in:

```
components/ui/
  Button.tsx
  Modal.tsx
  Input.tsx
  Badge.tsx
  Card.tsx
```

These components must NOT contain business logic.

---

# 6. Feature Components

Components tied to a specific feature must stay inside that feature folder.

**Correct:** `features/<feature-name>/<FeatureName>Component.tsx`

**Incorrect:** `components/<FeatureName>Component.tsx`

---

# 7. Lib Directory

The `lib` directory is only for shared utilities and infrastructure code.

**Allowed:**
```
lib/
  http.ts
  api-client.ts
  format.ts
  date.ts
  validators.ts
  constants.ts
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
  usePagination.ts
  useLocalStorage.ts
```

Feature-specific hooks must stay inside the feature folder:

```
features/<feature-name>/use<FeatureName>.ts
```

---

# 9. Types

Shared global types go in:

```
types/
  api.types.ts
  common.types.ts
```

Feature-specific types must stay inside the feature folder:

```
features/<feature-name>/<feature-name>.types.ts
```

---

# 10. Constants

Feature constants must stay inside the feature folder:

```
features/<feature-name>/<feature-name>.constants.ts
```

Global constants go inside:

```
lib/constants.ts
```

---

# 11. Services

Each feature should have its own service file for API calls and data transformation:

```
features/<feature-name>/<feature-name>.service.ts
```

---

# 12. Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Services | dot notation | `user.service.ts` |
| Types | dot notation | `user.types.ts` |
| Constants | dot notation | `user.constants.ts` |
| Contexts | dot notation | `user.context.tsx` |
| Hooks | camelCase with `use` prefix | `useUserProfile.ts` |
| Feature folders | kebab-case | `user-profile/` |

---

# 13. Import Rules

Prefer local imports within the feature:

```ts
// Good — local import within feature
import { UserType } from "./user.types"
import { fetchUser } from "./user.service"

// Bad — deep cross-feature import
import { UserType } from "../other-feature/other.types"
```

Avoid deep cross-feature imports.

---

# 14. Dependency Rules

Features must not depend directly on other features.

If sharing logic is required, move it to:

```
lib/
hooks/
components/ui/
types/
```

---

# 15. App Directory

The `app` directory must only contain:

- Routing files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`)
- Route groups `(group-name)/`
- API routes `api/`

**Business logic must not be placed here.**

Page components should be thin — they import and render feature components:

```tsx
// app/dashboard/page.tsx  ← thin page
import { DashboardOverview } from "@/features/dashboard/DashboardOverview"

export default function DashboardPage() {
  return <DashboardOverview />
}
```

---

# 16. Page Components

Page components should remain thin. They should:

- Fetch data (if server component)
- Render feature components

Do not write business logic directly inside `page.tsx` files.

---

# 17. Context

Feature-specific contexts must live inside the feature folder:

```
features/<feature-name>/<feature-name>.context.tsx
```

Global app-wide contexts go inside:

```
contexts/
  auth.context.tsx
  theme.context.tsx
```

---

# 18. Avoid God Files

Files should not exceed reasonable size.

**Recommended:** Component files < 300 lines

If a file grows too large, split it into smaller focused files within the same folder.

---

# 19. Avoid Barrel Files for Features

Avoid large `index.ts` barrel exports inside feature folders unless strictly necessary.

Per the `vercel-react-best-practices` skill: barrel files increase bundle size and slow down builds.

---

# 20. Code Organization Priority

When creating new code, follow this priority:

1. Check if it belongs to a feature → place inside `features/<name>/`
2. If reusable across features → move to `components/ui/`, `lib/`, or `hooks/`
3. If global state → place in `contexts/`
4. Never place feature logic in `lib/`
5. Never place feature components in `components/ui/`

---

# 21. AI Agent Instructions

When generating code:

- **Always** follow these architecture rules
- **Prefer** feature-based structure — colocate everything in `features/<name>/`
- **Never** place feature logic in `lib/`
- **Never** place feature components in `components/ui/`
- **Never** write business logic inside `app/` page files
- **Always** keep page components thin
- **Always** follow naming conventions in Rule #12

Violation of these rules is not allowed.