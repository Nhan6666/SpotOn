<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🏗️ PROJECT ARCHITECTURE — MANDATORY

> **AI agents MUST follow these rules strictly. Violation is not allowed.**
> Full rules: `../ARCHITECTURE_RULES.md`

## Folder Structure

```
src/
├── app/            ← Routing, layouts, page components ONLY (no business logic)
├── features/       ← ALL business logic lives here (colocated per feature)
├── components/
│   └── ui/         ← Shared reusable UI primitives (no business logic)
├── lib/            ← Shared utilities & infrastructure (http, format, date...)
├── hooks/          ← Shared hooks only (useDebounce, usePagination...)
├── types/          ← Global shared types only
├── contexts/       ← Global contexts only
└── i18n/           ← next-intl config ONLY (request.ts)
```

## Feature-Based Architecture (Rule #2–6)

Each feature is **fully self-contained** inside `features/<feature-name>/`:

```
features/
  <feature-name>/
    <FeatureName>Feature.tsx    ← UI component (PascalCase)
    <feature-name>.service.ts   ← API calls & data transformation
    <feature-name>.context.tsx  ← Feature-specific context
    <feature-name>.types.ts     ← Feature-specific types
    <feature-name>.schema.ts    ← Zod validation schemas (i18n-aware)
    <feature-name>.constants.ts ← Feature-specific constants
    use<FeatureName>.ts         ← Feature-specific hook
```

## Critical Rules for AI Code Generation

| Rule | Description |
|------|-------------|
| **Colocation** | Feature files stay together — NEVER spread across global folders |
| **Naming** | Components → `PascalCase.tsx` \| Services/Types/Constants → `feature.service.ts` |
| **`lib/`** | Only shared infra (`http.ts`, `errors.ts`, `format.ts`) — NEVER feature logic |
| **`components/ui/`** | Only shared primitives — NEVER business logic or feature components |
| **`app/`** | Only routing + thin page components that fetch data & render features |
| **`hooks/`** | Only shared hooks — feature hooks belong in `features/<name>/` |
| **`types/`** | Only global types — feature types belong in `features/<name>/` |
| **Cross-feature** | Features MUST NOT import from other features directly |
| **Page components** | Keep thin: fetch data → render feature components |
| **File size** | Component files < 300 lines |
| **No barrel files** | Avoid large `index.ts` exports inside feature folders |

## Code Organization Priority (Rule #20)

When creating new code:
1. Check if it belongs to a feature → place inside `features/<name>/`
2. If reusable across features → move to `components/ui/`, `lib/`, or `hooks/`
3. Never place feature logic in `lib/`, never place feature components in `components/ui/`

---

# 🌐 I18N — MANDATORY (next-intl)

> **KHÔNG BAO GIỜ hard-code chuỗi text tiếng Việt trực tiếp trong component.**

## Quy tắc bắt buộc

| Rule | Đúng ✅ | Sai ❌ |
|------|---------|--------|
| Text hiển thị | `t('auth.register.title')` | `"Tạo Tài Khoản Mới"` |
| Validation message | `t('validation.required')` | `"Trường này là bắt buộc"` |
| Error message | `t('common.error.generic')` | `"Có lỗi xảy ra"` |
| Placeholder | `t('auth.register.fields.fullNamePlaceholder')` | `"Nhập họ và tên"` |

## Cách thêm text mới

1. **Thêm key vào** `messages/vi.json` theo đúng namespace của feature
2. **Dùng trong component:**
   ```tsx
   const t = useTranslations(); // hoặc useTranslations('auth.register')
   <h1>{t('auth.register.title')}</h1>
   ```
3. **Schema validation:** Dùng factory pattern với `t`:
   ```ts
   const schema = useMemo(() => createRegisterSchema(t), [t]);
   ```

## Namespace Convention trong `messages/vi.json`

```json
{
  "common": { "error": {}, "appName": "" },
  "auth": { "register": {}, "login": {} },
  "validation": { "required": "", ... },
  "<feature>": { ... }
}
```

---

# 🚨 ERROR HANDLING — MANDATORY

> **KHÔNG BAO GIỜ dùng `try/catch` rỗng hoặc `console.error` làm error handling duy nhất.**

## Kiến trúc xử lý lỗi

```
API Response → lib/errors.ts (parseApiError) → AppError → Component setState
```

### Tầng 1 — lib/http.ts (tự động)
Mọi API call qua `http.*` đều tự parse lỗi thành `AppError`. KHÔNG fetch trực tiếp.

```ts
// ✅ Đúng
import { http } from '@/lib/http';
const data = await http.post('/auth/register', payload);

// ❌ Sai
const res = await fetch('/api/auth/register', { ... });
```

### Tầng 2 — Feature Service (auth.service.ts)
Service chỉ gọi `http.*`, không xử lý lỗi tại đây.

### Tầng 3 — Component/Hook (nơi gọi service)
```tsx
try {
  await authService.register(payload);
  setSuccess(t('auth.register.success'));
} catch (error) {
  if (error instanceof AppError) {
    // Xử lý từng loại lỗi cụ thể
    setServerError(t('common.error.generic'));
  }
}
```

## AppError codes

| Code | HTTP | Dùng khi |
|------|------|----------|
| `NETWORK_ERROR` | - | Mất kết nối internet |
| `UNAUTHORIZED` | 401 | Hết session, chưa đăng nhập |
| `FORBIDDEN` | 403 | Không đủ quyền |
| `NOT_FOUND` | 404 | Resource không tồn tại |
| `VALIDATION_ERROR` | 400 | Dữ liệu không hợp lệ (kèm fieldErrors) |
| `SERVER_ERROR` | 5xx | Lỗi server |

## Hiển thị lỗi trong form

```tsx
// Server error banner (toàn form)
{serverError && (
  <div role="alert" className="...bg-red-50...">
    {serverError}
  </div>
)}

// Field error (từng field)
{errors.email?.message && (
  <p role="alert" className="text-xs text-red-500">{errors.email.message}</p>
)}
```

---

# 📋 CHECKLIST trước khi commit

- [ ] Text hiển thị dùng `t()` từ `messages/vi.json`
- [ ] Validation schema trong file `*.schema.ts` riêng, dùng factory pattern
- [ ] API call qua `http.*` từ `lib/http.ts`, KHÔNG fetch trực tiếp
- [ ] Error handling dùng `AppError` từ `lib/errors.ts`
- [ ] Form dùng `react-hook-form` + `zodResolver`
- [ ] Submit button có `disabled` khi `isSubmitting`
- [ ] Error messages dùng `role="alert"` cho accessibility
- [ ] File < 300 lines

---

# SpotOn — Agent Skills

Dự án này sử dụng Vercel Agent Skills. **Đọc các file sau trước khi thực hiện bất kỳ tác vụ nào:**

## 🔴 CRITICAL — Luôn áp dụng

### React & Next.js Best Practices
- **File:** `.agents/skills/vercel-react-best-practices/AGENTS.md`
- **Áp dụng khi:** Viết component, data fetching, tối ưu bundle, refactor code
- **70+ rules** bao gồm: eliminating waterfalls, bundle size, server performance, re-render optimization

### React Composition Patterns
- **File:** `.agents/skills/vercel-composition-patterns/AGENTS.md`
- **Áp dụng khi:** Refactor prop drilling, tạo compound components, dùng Context/Provider
- **Rules chính:** Tránh boolean props, dùng compound components, decouple state vào Provider

## 🟡 HIGH — Áp dụng khi liên quan

### View Transitions & Animations
- **File:** `.agents/skills/vercel-react-view-transitions/SKILL.md`
- **Áp dụng khi:** Thêm animation, page transitions, shared element morphing
- **Refs:** `.agents/skills/vercel-react-view-transitions/references/`

### Vercel Optimization Audit
- **File:** `.agents/skills/vercel-optimize/SKILL.md`
- **Áp dụng khi:** Tối ưu Vercel bill, slow routes, caching, Core Web Vitals

## 🟢 ON-DEMAND — Dùng khi cần

### Deploy to Vercel
- **File:** `.agents/skills/deploy-to-vercel/SKILL.md`
- **Áp dụng khi:** Deploy app lên Vercel
- **Quy tắc:** Luôn deploy **preview**, không deploy production trừ khi được yêu cầu rõ ràng

### Vercel CLI with Tokens
- **File:** `.agents/skills/vercel-cli-with-tokens/SKILL.md`
- **Áp dụng khi:** Dùng Vercel CLI với token auth (CI/CD)
- **Quy tắc:** KHÔNG bao giờ pass token qua `--token` flag, dùng env var `VERCEL_TOKEN`

### React Native & Expo
- **File:** `.agents/skills/vercel-react-native-skills/AGENTS.md`
- **Áp dụng khi:** Build React Native/Expo mobile app

### Web Design Guidelines / UI Audit
- **File:** `.agents/skills/web-design-guidelines/SKILL.md`
- **Áp dụng khi:** Review UI code, kiểm tra accessibility
- **Fetch guidelines từ:** `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`

---

> 📖 Xem hướng dẫn đầy đủ và prompts theo use case tại: `.agents/AGENT_SKILLS_PROMPT.md`

