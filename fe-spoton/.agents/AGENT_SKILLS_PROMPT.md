# 🤖 SpotOn — Agent Skills Master Prompt

> Copy và paste prompt bên dưới vào đầu mỗi cuộc trò chuyện với AI agent để kích hoạt toàn bộ skill.

---

## ⚡ QUICK PROMPT (dán vào chat)

```
Bạn đang làm việc trong dự án Next.js SpotOn tại thư mục `d:\KI_7\SDN\SpotOn\fe-spoton`.

Hãy đọc và áp dụng các agent skills sau trước khi thực hiện bất kỳ tác vụ nào:

1. `vercel-react-best-practices` → .agents/skills/vercel-react-best-practices/AGENTS.md
2. `vercel-composition-patterns`  → .agents/skills/vercel-composition-patterns/AGENTS.md
3. `vercel-react-view-transitions` → .agents/skills/vercel-react-view-transitions/SKILL.md
4. `vercel-optimize`              → .agents/skills/vercel-optimize/SKILL.md
5. `deploy-to-vercel`             → .agents/skills/deploy-to-vercel/SKILL.md
6. `vercel-cli-with-tokens`       → .agents/skills/vercel-cli-with-tokens/SKILL.md
7. `vercel-react-native-skills`   → .agents/skills/vercel-react-native-skills/AGENTS.md
8. `web-design-guidelines`        → .agents/skills/web-design-guidelines/SKILL.md

Bây giờ hãy thực hiện yêu cầu sau:
[VIẾT YÊU CẦU CỦA BẠN Ở ĐÂY]
```

---

## 📘 Tóm Tắt Từng Skill

### 1. `vercel-react-best-practices` — React & Next.js Performance
**Khi nào dùng:** Viết component mới, data fetching, review code, tối ưu bundle size.

| Ưu tiên | Danh mục | Mức ảnh hưởng |
|---------|---------|--------------|
| 1 | Eliminating Waterfalls (`async-`) | CRITICAL |
| 2 | Bundle Size Optimization (`bundle-`) | CRITICAL |
| 3 | Server-Side Performance (`server-`) | HIGH |
| 4 | Client-Side Data Fetching (`client-`) | MEDIUM-HIGH |
| 5 | Re-render Optimization (`rerender-`) | MEDIUM |
| 6 | Rendering Performance (`rendering-`) | MEDIUM |
| 7 | JavaScript Performance (`js-`) | LOW-MEDIUM |
| 8 | Advanced Patterns (`advanced-`) | LOW |

**Trigger phrases:** "viết component", "tối ưu hiệu suất", "data fetching", "bundle size"

---

### 2. `vercel-composition-patterns` — Component Architecture
**Khi nào dùng:** Refactor component có nhiều boolean props, xây dựng compound components, React Context.

| Ưu tiên | Danh mục | Prefix |
|---------|---------|--------|
| 1 | Component Architecture | `architecture-` |
| 2 | State Management | `state-` |
| 3 | Implementation Patterns | `patterns-` |
| 4 | React 19 APIs | `react19-` |

**Rules chính:**
- `architecture-avoid-boolean-props` — Không dùng boolean props, dùng composition
- `architecture-compound-components` — Compound components với shared context
- `state-decouple-implementation` — Provider quản lý state duy nhất
- `patterns-children-over-render-props` — Ưu tiên children thay render props

**Trigger phrases:** "refactor component", "compound component", "prop drilling", "context"

---

### 3. `vercel-react-view-transitions` — Animations & Transitions
**Khi nào dùng:** Thêm page transition, shared element animation, route change animation.

**Cách dùng cơ bản:**
```jsx
import { ViewTransition } from 'react';

// Enter/Exit
<ViewTransition enter="fade-in" exit="fade-out">
  <Component />
</ViewTransition>

// Shared Element
<ViewTransition name={`item-${id}`} share="morph">
  <Image />
</ViewTransition>

// Type-keyed directional
<ViewTransition
  enter={{ 'nav-forward': 'slide-from-right', default: 'none' }}
  exit={{ 'nav-forward': 'slide-to-left', default: 'none' }}
>
  <Page />
</ViewTransition>
```

**Trigger phrases:** "animation", "page transition", "view transition", "slide effect"

---

### 4. `vercel-optimize` — Vercel Cost & Performance Audit
**Khi nào dùng:** Giảm bill Vercel, tối ưu slow routes, caching, Core Web Vitals.

**Pipeline:**
1. Collect signals → `node scripts/collect-signals.mjs`
2. Scan codebase → `node scripts/scan-codebase.mjs`
3. Gate candidates → `node scripts/gate-investigations.mjs`
4. Deep-dive & reconcile
5. Verify recommendations
6. Render report

**Trigger phrases:** "vercel bill", "slow route", "optimize performance", "reduce cost"

---

### 5. `deploy-to-vercel` — Deployment
**Khi nào dùng:** Deploy app, tạo preview link, push lên production.

**Flow deploy:**
```bash
# Kiểm tra trạng thái
git remote get-url origin
cat .vercel/project.json

# Deploy preview
vercel deploy -y --no-wait --scope <team-slug>

# Deploy production (chỉ khi được yêu cầu rõ ràng)
vercel deploy --prod -y --no-wait --scope <team-slug>
```

**Quy tắc:** Luôn deploy preview, không deploy production trừ khi user yêu cầu rõ.

**Trigger phrases:** "deploy", "push live", "tạo preview link", "đưa lên vercel"

---

### 6. `vercel-cli-with-tokens` — Vercel CLI Auth với Token
**Khi nào dùng:** Khi cần dùng Vercel CLI mà không có `vercel login` (CI/CD, automation).

**Setup token:**
```bash
# Đúng — set env var
export VERCEL_TOKEN="vca_abc123"
vercel deploy

# SAI — không bao giờ pass token qua flag
vercel deploy --token "vca_abc123"  ← KHÔNG ĐƯỢC
```

**Trigger phrases:** "vercel token", "CI/CD deploy", "env variables vercel", "vercel auth"

---

### 7. `vercel-react-native-skills` — React Native & Expo
**Khi nào dùng:** Build React Native/Expo app, tối ưu list, animations mobile.

| Ưu tiên | Danh mục | Prefix |
|---------|---------|--------|
| 1 | List Performance | `list-performance-` |
| 2 | Animation | `animation-` |
| 3 | Navigation | `navigation-` |
| 4 | UI Patterns | `ui-` |
| 5 | State Management | `react-state-` |
| 6 | Rendering | `rendering-` |
| 7 | Monorepo | `monorepo-` |
| 8 | Configuration | `fonts-`, `imports-` |

**Trigger phrases:** "react native", "expo", "mobile app", "FlashList", "Reanimated"

---

### 8. `web-design-guidelines` — UI/UX Audit
**Khi nào dùng:** Review UI code, kiểm tra accessibility, audit design theo best practices.

**Cách dùng:**
1. Fetch guidelines từ: `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
2. Đọc file cần review
3. Kiểm tra theo tất cả rules
4. Output theo format `file:line`

**Trigger phrases:** "review UI", "check accessibility", "audit design", "UX review"

---

## 🎯 Prompt Theo Từng Use Case

### ➡️ Viết Component Mới
```
Áp dụng skill: vercel-react-best-practices + vercel-composition-patterns
Đọc: .agents/skills/vercel-react-best-practices/AGENTS.md
     .agents/skills/vercel-composition-patterns/AGENTS.md

Tạo component [TÊN COMPONENT] với các yêu cầu sau:
[YÊU CẦU]
```

### ➡️ Refactor Có Prop Drilling
```
Áp dụng skill: vercel-composition-patterns
Đọc: .agents/skills/vercel-composition-patterns/AGENTS.md

Refactor [TÊN FILE] để loại bỏ prop drilling, dùng compound components + React Context.
Giữ nguyên UI/visual output.
```

### ➡️ Thêm Animation
```
Áp dụng skill: vercel-react-view-transitions
Đọc: .agents/skills/vercel-react-view-transitions/SKILL.md
     .agents/skills/vercel-react-view-transitions/references/implementation.md
     .agents/skills/vercel-react-view-transitions/references/css-recipes.md

Thêm view transitions cho [MÔ TẢ].
```

### ➡️ Deploy Lên Vercel
```
Áp dụng skill: deploy-to-vercel
Đọc: .agents/skills/deploy-to-vercel/SKILL.md

Deploy project này lên Vercel dưới dạng preview deployment.
```

### ➡️ Tối Ưu Performance
```
Áp dụng skill: vercel-react-best-practices + vercel-optimize
Đọc: .agents/skills/vercel-react-best-practices/AGENTS.md
     .agents/skills/vercel-optimize/SKILL.md

Review và tối ưu [TÊN FILE/ROUTE] theo các best practices.
```

### ➡️ Review UI/Accessibility
```
Áp dụng skill: web-design-guidelines
Đọc: .agents/skills/web-design-guidelines/SKILL.md
Fetch: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

Review file [TÊN FILE] theo Web Interface Guidelines.
```

---

## 📁 Cấu Trúc Skills

```
fe-spoton/.agents/skills/
├── deploy-to-vercel/
│   ├── SKILL.md                    ← Entry point
│   └── resources/deploy.sh
├── vercel-cli-with-tokens/
│   └── SKILL.md                    ← Entry point
├── vercel-composition-patterns/
│   ├── SKILL.md                    ← Quick reference
│   ├── AGENTS.md                   ← Full guide (đọc cái này)
│   └── rules/*.md                  ← Chi tiết từng rule
├── vercel-optimize/
│   ├── SKILL.md                    ← Entry point
│   ├── scripts/*.mjs               ← Pipeline scripts
│   └── references/*.md             ← Doctrine, scoring, etc.
├── vercel-react-best-practices/
│   ├── SKILL.md                    ← Quick reference
│   ├── AGENTS.md                   ← Full guide (108KB, đọc cái này)
│   └── rules/*.md                  ← Chi tiết từng rule
├── vercel-react-native-skills/
│   ├── SKILL.md                    ← Quick reference
│   ├── AGENTS.md                   ← Full guide (đọc cái này)
│   └── rules/*.md
├── vercel-react-view-transitions/
│   ├── SKILL.md                    ← Entry point
│   ├── AGENTS.md                   ← Full compiled guide
│   └── references/*.md             ← CSS recipes, Next.js, patterns
└── web-design-guidelines/
    └── SKILL.md                    ← Entry point (fetch từ URL)
```
