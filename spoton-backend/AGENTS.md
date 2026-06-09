<!-- BEGIN:backend-agent-rules -->
# 🏗️ BACKEND PROJECT ARCHITECTURE — MANDATORY

> **AI agents MUST follow these rules strictly. Violation is not allowed.**

## Technology Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs

## Folder Structure

```
src/
├── config/         ← Configuration files (DB connection, environment variables)
├── controllers/    ← Request handlers (Business logic, processing input/output)
├── middlewares/    ← Express middlewares (Authentication, error handling, logging)
├── models/         ← Mongoose schemas and models
├── routes/         ← API route definitions (Mapping URLs to controllers)
├── utils/          ← Helper functions and shared utilities (e.g., sendEmail)
├── server.js       ← Entry point of the Express application
└── seed.js         ← Database seeding script
```

## Critical Rules for AI Code Generation

| Rule | Description |
|------|-------------|
| **Separation of Concerns** | Routes ONLY define paths. Controllers handle logic. Models define data. |
| **Fat Models, Skinny Controllers** | Keep controllers clean. Put complex DB queries and methods in models/services if necessary. |
| **Response Format** | ALWAYS return standard JSON format: `{ success: boolean, message: string, data?: any }` |
| **Async/Await** | Use `async/await` for asynchronous operations. Avoid using raw `.then().catch()`. |
| **Error Handling** | Every controller MUST wrap its logic in a `try...catch` block to prevent server crashes. |

---

# 🚨 ERROR HANDLING & RESPONSE FORMAT — MANDATORY

> **NEVER leave unhandled promise rejections or return inconsistent JSON structures.**

## Standard API Response Structure

**Thành công (Success - 2xx):**
```javascript
res.status(200).json({
  success: true,
  message: 'Thao tác thành công.',
  data: { ... } // (Tuỳ chọn) Dữ liệu trả về
});
```

**Thất bại / Lỗi (Error - 4xx, 5xx):**
```javascript
res.status(400).json({
  success: false,
  message: 'Mô tả lỗi cụ thể.'
});
```

## Xử lý lỗi trong Controller (Try/Catch)
Mọi hàm trong Controller đều phải có `try...catch`.

```javascript
// ✅ Đúng
const doSomething = async (req, res) => {
  try {
    const data = await Model.find();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Lỗi doSomething:', error);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ.' });
  }
};

// ❌ Sai
const doSomething = async (req, res) => {
  const data = await Model.find(); // Nếu lỗi sẽ sập server
  res.send(data);
};
```

---

# 🌐 BẢO MẬT & MẬT KHẨU (SECURITY)

- **Băm mật khẩu (Hashing):** Mật khẩu người dùng LUÔN được băm bằng `bcryptjs` trước khi lưu vào database.
- **Token (JWT):** API bảo mật sử dụng JWT. JWT Secret phải lấy từ `process.env.JWT_SECRET`.
- **Thông tin nhạy cảm:** KHÔNG BAO GIỜ trả về password hash hoặc thông tin nhạy cảm của User trong response JSON.

---

# 📋 CHECKLIST trước khi commit

- [ ] Route mới đã được đăng ký đúng cách trong `server.js` hoặc file router tổng chưa?
- [ ] Controller có bọc bằng `try/catch` không?
- [ ] Phản hồi HTTP (Response) có tuân theo định dạng chuẩn `{ success, message, ... }` chưa?
- [ ] Đã trả về đúng HTTP Status Code (200, 201, 400, 401, 403, 404, 500) chưa?
- [ ] Dữ liệu đầu vào (req.body, req.params) đã được kiểm tra (validate) trước khi xử lý chưa?
- [ ] Đã xóa bỏ các comment hoặc console.log dư thừa chưa (ngoại trừ console.error cho catch block)?
<!-- END:backend-agent-rules -->
