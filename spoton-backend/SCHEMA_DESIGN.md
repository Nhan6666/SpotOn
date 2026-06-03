# SPOTON - FULL MONGODB SCHEMA DESIGN (FINAL)

---

## 1. COLLECTION: USERS

| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `email` | String | unique, required — Định danh đăng nhập |
| `password_hash` | String | null nếu dùng Google OAuth |
| `auth_provider` | String | Enum: `LOCAL`, `GOOGLE` — default: `LOCAL` |
| `google_id` | String | ID từ Google OAuth |
| `full_name` | String | required |
| `phone` | String | Chỉ dùng liên hệ, KHÔNG dùng đăng nhập |
| `role` | String | Enum: `ADMIN`, `MANAGER`, `WAITER`, `CUSTOMER` — default: `CUSTOMER` |
| `is_email_verified` | Boolean | default: false — Tự động true nếu auth Google |
| `profile_allergies` | String | Hồ sơ dị ứng KH (Embedded) |
| `profile_vip_notes` | String | Ghi chú VIP KH (Embedded) |
| `created_at` | Date | auto |
| `updated_at` | Date | auto |

---

## 2. COLLECTION: BRANCHES

| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `manager_id` | ObjectId → Users | Manager quản lý chi nhánh |
| `name` | String | required |
| `address` | String | required |
| `hotline` | String | |
| `images` | [String] | Mảng link ảnh chi nhánh |
| `open_time` | String | VD: "09:00" |
| `close_time` | String | VD: "22:00" |
| `status` | String | Enum: `OPEN`, `FULL`, `CLOSED` — default: `OPEN` |
| `overload_threshold` | Number | Ngưỡng báo động % — default: 95 |
| `zones` | [ZoneSchema] | Embedded array |
| `created_at` | Date | auto |
| `updated_at` | Date | auto |

### Zones (Embedded in Branches)

| Field | Type | Ghi chú |
|---|---|---|
| `name` | String | required — VD: "Sân vườn", "Tầng 1" |
| `capacity` | Number | Tổng sức chứa khu vực |
| `tables` | [TableSchema] | Embedded array |

### Tables (Embedded in Zones)

| Field | Type | Ghi chú |
|---|---|---|
| `table_number` | String | required |
| `capacity` | Number | required |
| `status` | String | Enum: `EMPTY`, `HOLDING`, `LOCKED`, `RESERVED`, `OCCUPIED`, `CLEANING` — default: `EMPTY` |

---

## 3. COLLECTION: MENUS

| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `branch_id` | ObjectId → Branches | null = Menu dùng chung toàn chuỗi |
| `category_name` | String | required — VD: "Khai vị", "Đồ uống" |
| `items` | [MenuItemSchema] | Embedded array |
| `created_at` | Date | auto |
| `updated_at` | Date | auto |

### MenuItems (Embedded in Menus)

| Field | Type | Ghi chú |
|---|---|---|
| `name` | String | required |
| `description` | String | |
| `dietary_tags` | [String] | VD: ["vegan", "gluten-free"] |
| `price` | Number | required, min: 0 |
| `is_available` | Boolean | default: true — Bật/tắt khi hết nguyên liệu |
| `image_url` | String | |

---

## 4. COLLECTION: BOOKINGS

| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `customer_id` | ObjectId → Users | null nếu là khách Walk-in |
| `walk_in_name` | String | Tên khách Walk-in do Waiter nhập |
| `walk_in_phone` | String | SĐT khách Walk-in |
| `branch_id` | ObjectId → Branches | required |
| `reservation_date` | Date | required |
| `arrival_time` | String | VD: "19:00" |
| `guest_count` | Number | min: 1 |
| `status` | String | Enum: `PENDING_DEPOSIT`, `CONFIRMED`, `CANCELLED`, `NO_SHOW`, `COMPLETED` — default: `PENDING_DEPOSIT` |
| `cancellation_reason` | String | Lý do hủy bàn |
| `note` | String | |
| `assigned_tables` | [AssignedTableSchema] | Embedded array |
| `order_items` | [OrderItemSchema] | Embedded array |
| `payment_info` | PaymentInfoSchema | Embedded object 1-1 |
| `created_at` | Date | auto |
| `updated_at` | Date | auto |

### AssignedTables (Embedded in Bookings)

| Field | Type | Ghi chú |
|---|---|---|
| `zone_name` | String | |
| `table_number` | String | |

### OrderItems (Embedded in Bookings)

| Field | Type | Ghi chú |
|---|---|---|
| `menu_item_id` | ObjectId → Menus | Tham chiếu món ăn |
| `name` | String | Snapshot tên món tại thời điểm đặt |
| `quantity` | Number | min: 1 |
| `price_at_time` | Number | Snapshot giá — chống sai lệch hóa đơn |
| `prep_status` | String | Enum: `PENDING`, `PREPARING`, `READY`, `SERVED` — default: `PENDING` |
| `type` | String | Enum: `PRE_ORDER`, `ADDITIONAL` — default: `PRE_ORDER` |

### PaymentInfo (Embedded object 1-1 in Bookings)

| Field | Type | Ghi chú |
|---|---|---|
| `transaction_id` | String | Mã giao dịch VNPay trả về |
| `total_amount` | Number | |
| `deposit_amount` | Number | |
| `method` | String | Enum: `VNPAY`, `MOMO`, `CASH`, `BANK_TRANSFER` — default: `VNPAY` |
| `status` | String | Enum: `PENDING`, `PAID`, `FAILED`, `REFUNDED` — default: `PENDING` |
| `voucher_code` | String | |
| `discount_amount` | Number | default: 0 |
| `paid_at` | Date | Thời điểm thanh toán thành công |

---

## 5. COLLECTION: VOUCHERS

| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `code` | String | unique, required, uppercase |
| `branch_id` | ObjectId → Branches | null = Voucher toàn chuỗi |
| `discount_percentage` | Number | min: 0, max: 100 |
| `max_discount_amount` | Number | Giảm tối đa |
| `min_order_value` | Number | Đơn tối thiểu — default: 0 |
| `valid_from` | Date | |
| `valid_until` | Date | |
| `usage_limit` | Number | undefined = không giới hạn |
| `used_count` | Number | default: 0 |
| `is_active` | Boolean | default: true — Bật/tắt voucher |
| `created_at` | Date | auto |
| `updated_at` | Date | auto |

---

## 6. COLLECTION: FEEDBACKS

| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `booking_id` | ObjectId → Bookings | required — 1 đơn chỉ review 1 lần |
| `branch_id` | ObjectId → Branches | required |
| `customer_id` | ObjectId → Users | required |
| `rating` | Number | required, min: 1, max: 5 |
| `comment` | String | |
| `reply_comment` | String | Manager phản hồi lại khách |
| `is_hidden` | Boolean | default: false — Ẩn đánh giá vi phạm |
| `created_at` | Date | auto |

---

## 7. COLLECTION: WAITLISTS

| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `branch_id` | ObjectId → Branches | required |
| `customer_id` | ObjectId → Users | null nếu khách Walk-in |
| `walk_in_name` | String | Tên khách đợi offline |
| `walk_in_phone` | String | |
| `guest_count` | Number | required, min: 1 |
| `status` | String | Enum: `WAITING`, `NOTIFIED`, `SEATED`, `CANCELLED` — default: `WAITING` |
| `joined_at` | Date | default: Date.now |

---

## 8. COLLECTION: ARTICLES

| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `author_id` | ObjectId → Users | required — Người đăng (Admin) |
| `title` | String | required |
| `content` | String | required — HTML hoặc Markdown |
| `image_url` | String | |
| `is_published` | Boolean | default: true |
| `tags` | [String] | VD: ["khuyến mãi", "sự kiện"] |
| `created_at` | Date | auto |
| `updated_at` | Date | auto |

---

## 9. COLLECTION: NOTIFICATIONS

| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `user_id` | ObjectId → Users | required — Người nhận |
| `type` | String | Enum: `REMINDER`, `OVERLOAD_ALERT`, `PROMO`, `REFUND`, `BOOKING_UPDATE` — required |
| `title` | String | required |
| `content` | String | required |
| `is_read` | Boolean | default: false |
| `created_at` | Date | auto |

---

## 10. COLLECTION: SYSTEMCONFIGS

| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `config_key` | String | unique, required — VD: `HOLDING_TIMEOUT_MINUTES` |
| `config_value` | String | Lưu các thông số vận hành (JSON String) |
| `description` | String | Mô tả cấu hình cho Admin dễ hiểu |
| `updated_at` | Date | auto |

---

## Tóm tắt Relationships

```
Users ──< Bookings (customer_id)
Users ──< Branches (manager_id)
Users ──< Feedbacks (customer_id)
Users ──< Notifications (user_id)
Users ──< Waitlists (customer_id)
Users ──< Articles (author_id)

Branches ──< Bookings (branch_id)
Branches ──< Menus (branch_id)
Branches ──< Vouchers (branch_id)
Branches ──< Feedbacks (branch_id)
Branches ──< Waitlists (branch_id)
Branches >--< Zones (embedded)
Zones >--< Tables (embedded)

Bookings >-- AssignedTables (embedded)
Bookings >-- OrderItems (embedded)
Bookings >-- PaymentInfo (embedded 1-1)
Bookings ──< Feedbacks (booking_id)

Menus >--< MenuItems (embedded)
```

---

## Changelog

| Phiên bản | Thay đổi |
|---|---|
| v1.0 | Schema ban đầu |
| v1.1 | Bổ sung: `Vouchers.is_active`, `Notifications.BOOKING_UPDATE`, `PaymentInfo.paid_at`, `PaymentInfo.method` thêm MOMO/CASH/BANK_TRANSFER, `Articles.tags` |
