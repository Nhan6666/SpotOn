# SpotOn 🍽️

Hệ thống đặt bàn và quản lý nhà hàng trực tuyến.

## Cấu trúc dự án (Monorepo)

```
SpotOn/
├── fe-spoton/          ← Frontend (Next.js 16, TypeScript, TailwindCSS)
├── spoton-backend/     ← Backend API (Node.js, Express, MongoDB)
└── ARCHITECTURE_RULES.md
```

## Khởi động nhanh

### Backend
```bash
cd spoton-backend
npm install
npm run dev       # Chạy tại http://localhost:5000
```

### Frontend
```bash
cd fe-spoton
npm install
npm run dev       # Chạy tại http://localhost:3000
```

### Seed dữ liệu mẫu
```bash
cd spoton-backend
node src/seed.js
```

## Tài khoản test (password: `Spoton@123`)

| Role | Email |
|---|---|
| ADMIN | admin@spoton.vn |
| MANAGER | manager.q1@spoton.vn |
| WAITER | waiter01@spoton.vn |
| CUSTOMER | khachhang01@gmail.com |

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, TypeScript, TailwindCSS 4, next-intl |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB (local / Atlas) |
| Auth | JWT, bcryptjs |
| Validation | Zod, React Hook Form |

## Tài liệu

- [Schema Database](./spoton-backend/SCHEMA_DESIGN.md)
- [Architecture Rules](./ARCHITECTURE_RULES.md)
- [Frontend Agent Rules](./fe-spoton/AGENTS.md)
