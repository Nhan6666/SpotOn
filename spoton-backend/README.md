# SpotOn Backend API

REST API cho hệ thống quản lý nhà hàng SpotOn, xây dựng bằng **Node.js + Express + MongoDB (Mongoose)**.

---

## 🚀 Cài đặt & Chạy

```bash
# 1. Clone repository
git clone <repo-url>
cd spoton-backend

# 2. Cài dependencies
npm install

# 3. Tạo file .env từ template
cp .env.example .env
# Sau đó điền MONGO_URI và JWT_SECRET vào file .env

# 4. Chạy server (Development)
npm run dev

# 5. Chạy server (Production)
npm start
```

---

## 📁 Cấu trúc thư mục

```
spoton-backend/
├── .env                    # Biến môi trường (KHÔNG commit!)
├── .env.example            # Template biến môi trường (commit OK)
├── .gitignore
├── package.json
├── README.md
└── src/
    ├── server.js           # Entry point - Chạy server Express
    ├── config/
    │   └── db.js           # Kết nối MongoDB
    ├── models/             # Mongoose Schemas
    │   ├── User.js
    │   ├── Branch.js       # (bao gồm Zone & Table embedded)
    │   ├── Menu.js         # (bao gồm MenuItem embedded)
    │   ├── Booking.js      # (bao gồm AssignedTable, OrderItem, PaymentInfo)
    │   ├── Voucher.js
    │   ├── Feedback.js
    │   ├── Waitlist.js
    │   ├── Article.js
    │   ├── Notification.js
    │   └── SystemConfig.js
    ├── controllers/        # Xử lý business logic
    │   ├── authController.js
    │   ├── bookingController.js
    │   ├── branchController.js
    │   └── menuController.js
    ├── routes/             # Định nghĩa API endpoints
    │   ├── authRoutes.js
    │   ├── bookingRoutes.js
    │   ├── branchRoutes.js
    │   └── menuRoutes.js
    └── middlewares/        # Middleware xác thực & phân quyền
        └── authMiddleware.js
```

---

## 🔗 API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/v1/health` | Health check | Public |
| POST | `/api/v1/auth/register` | Đăng ký | Public |
| POST | `/api/v1/auth/login` | Đăng nhập | Public |
| POST | `/api/v1/auth/google` | Google OAuth | Public |
| GET | `/api/v1/auth/me` | Thông tin tôi | Private |
| GET | `/api/v1/branches` | Danh sách chi nhánh | Public |
| POST | `/api/v1/branches` | Tạo chi nhánh | Admin |
| GET | `/api/v1/menus` | Danh sách menu | Public |
| POST | `/api/v1/bookings` | Tạo đặt bàn | Public |
| GET | `/api/v1/bookings/my-bookings` | Đặt bàn của tôi | Customer |

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v4
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcryptjs
- **Security**: Helmet, CORS
- **Dev**: Nodemon

---

## 👥 Quy ước code cho nhóm

1. Mỗi member phụ trách 1 **Epic/Feature** → tạo branch riêng: `feature/auth`, `feature/booking`
2. **Không commit** file `.env` lên git
3. Tất cả response API theo chuẩn: `{ success: true/false, data: {}, message: '' }`
4. Đặt tên route theo REST convention: `/api/v1/<resource>`
