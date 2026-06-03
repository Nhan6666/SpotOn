require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import Models
const User         = require('./models/User');
const Branch       = require('./models/Branch');
const Menu         = require('./models/Menu');
const Booking      = require('./models/Booking');
const Voucher      = require('./models/Voucher');
const Feedback     = require('./models/Feedback');
const Notification = require('./models/Notification');
const Waitlist     = require('./models/Waitlist');
const Article      = require('./models/Article');
const SystemConfig = require('./models/SystemConfig');

const connectDB = require('./config/db');

// ============================================================
// SEED DATA
// ============================================================

async function seed() {
  await connectDB();
  console.log('\n🌱 Bắt đầu seed dữ liệu SpotOn...\n');

  // ---- Xóa dữ liệu cũ ----
  await Promise.all([
    User.deleteMany({}),
    Branch.deleteMany({}),
    Menu.deleteMany({}),
    Booking.deleteMany({}),
    Voucher.deleteMany({}),
    Feedback.deleteMany({}),
    Notification.deleteMany({}),
    Waitlist.deleteMany({}),
    Article.deleteMany({}),
    SystemConfig.deleteMany({}),
  ]);
  console.log('🗑️  Đã xóa dữ liệu cũ');

  // ============================================================
  // 1. USERS
  // ============================================================
  const passwordHash = await bcrypt.hash('Spoton@123', 10);

  const users = await User.insertMany([
    {
      email: 'admin@spoton.vn',
      password_hash: passwordHash,
      full_name: 'Super Admin',
      phone: '0901000001',
      role: 'ADMIN',
      is_email_verified: true,
    },
    {
      email: 'manager.q1@spoton.vn',
      password_hash: passwordHash,
      full_name: 'Nguyễn Văn Quản',
      phone: '0901000002',
      role: 'MANAGER',
      is_email_verified: true,
    },
    {
      email: 'waiter01@spoton.vn',
      password_hash: passwordHash,
      full_name: 'Trần Thị Phục',
      phone: '0901000003',
      role: 'WAITER',
      is_email_verified: true,
    },
    {
      email: 'khachhang01@gmail.com',
      password_hash: passwordHash,
      full_name: 'Lê Minh Nhân',
      phone: '0909123456',
      role: 'CUSTOMER',
      is_email_verified: true,
    },
    {
      email: 'khachhang02@gmail.com',
      password_hash: passwordHash,
      full_name: 'Phạm Thị Hương',
      phone: '0909654321',
      role: 'CUSTOMER',
      is_email_verified: false,
    },
  ]);
  console.log(`👤 Đã tạo ${users.length} users`);

  // ============================================================
  // 2. BRANCHES
  // ============================================================
  const branches = await Branch.insertMany([
    {
      manager_id: users[1]._id, // manager.q1
      name: 'SpotOn Quận 1 - Bến Nghé',
      address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM',
      hotline: '028 3822 1001',
      images: ['https://picsum.photos/seed/branch1/800/600'],
      open_time: '09:00',
      close_time: '22:00',
      status: 'OPEN',
      overload_threshold: 90,
      zones: [
        {
          name: 'Tầng 1 - Trong nhà',
          capacity: 40,
          tables: [
            { table_number: 'T101', capacity: 2, status: 'OCCUPIED' },
            { table_number: 'T102', capacity: 2, status: 'RESERVED' },
            { table_number: 'T103', capacity: 4, status: 'EMPTY' },
            { table_number: 'T104', capacity: 4, status: 'EMPTY' },
            { table_number: 'T105', capacity: 6, status: 'CLEANING' },
          ],
        },
        {
          name: 'Sân thượng - Ngoài trời',
          capacity: 30,
          tables: [
            { table_number: 'ST01', capacity: 4, status: 'EMPTY' },
            { table_number: 'ST02', capacity: 4, status: 'HOLDING' },
            { table_number: 'ST03', capacity: 6, status: 'EMPTY' },
            { table_number: 'ST04', capacity: 8, status: 'EMPTY' },
          ],
        },
        {
          name: 'Phòng VIP',
          capacity: 20,
          tables: [
            { table_number: 'VIP01', capacity: 8, status: 'RESERVED' },
            { table_number: 'VIP02', capacity: 10, status: 'EMPTY' },
          ],
        },
      ],
    },
    {
      manager_id: null,
      name: 'SpotOn Quận 7 - Phú Mỹ Hưng',
      address: '88 Nguyễn Đức Cảnh, Phường Tân Phong, Quận 7, TP.HCM',
      hotline: '028 5413 2002',
      images: ['https://picsum.photos/seed/branch2/800/600'],
      open_time: '10:00',
      close_time: '22:30',
      status: 'OPEN',
      overload_threshold: 85,
      zones: [
        {
          name: 'Khu gia đình',
          capacity: 50,
          tables: [
            { table_number: 'GD01', capacity: 4, status: 'EMPTY' },
            { table_number: 'GD02', capacity: 4, status: 'EMPTY' },
            { table_number: 'GD03', capacity: 6, status: 'OCCUPIED' },
            { table_number: 'GD04', capacity: 8, status: 'EMPTY' },
          ],
        },
        {
          name: 'Khu view hồ bơi',
          capacity: 24,
          tables: [
            { table_number: 'HB01', capacity: 4, status: 'RESERVED' },
            { table_number: 'HB02', capacity: 4, status: 'EMPTY' },
            { table_number: 'HB03', capacity: 6, status: 'EMPTY' },
          ],
        },
      ],
    },
  ]);
  console.log(`🏢 Đã tạo ${branches.length} branches`);

  // ============================================================
  // 3. MENUS
  // ============================================================
  const menus = await Menu.insertMany([
    // --- Khai vị (Toàn chuỗi) ---
    {
      branch_id: null,
      category_name: 'Khai Vị',
      items: [
        { name: 'Gỏi cuốn tôm thịt', description: 'Gỏi cuốn tươi với tôm, thịt heo, rau thơm', price: 65000, dietary_tags: [], is_available: true, image_url: 'https://picsum.photos/seed/goicuon/300/200' },
        { name: 'Chả giò rế', description: 'Chả giò giòn tan, nhân thịt heo và nấm', price: 75000, dietary_tags: [], is_available: true, image_url: 'https://picsum.photos/seed/chagioroe/300/200' },
        { name: 'Súp bào ngư', description: 'Súp bào ngư thượng hạng, thanh đạm', price: 120000, dietary_tags: [], is_available: true, image_url: 'https://picsum.photos/seed/supbaongu/300/200' },
      ],
    },
    // --- Món chính (Chi nhánh Q1) ---
    {
      branch_id: branches[0]._id,
      category_name: 'Món Chính',
      items: [
        { name: 'Bò nướng lá lốt', description: 'Bò nướng thơm ngon cuốn lá lốt', price: 195000, dietary_tags: [], is_available: true, image_url: 'https://picsum.photos/seed/bonuong/300/200' },
        { name: 'Cá lóc nướng trui', description: 'Cá lóc nướng đặc trưng Nam Bộ', price: 280000, dietary_tags: [], is_available: true, image_url: 'https://picsum.photos/seed/caloc/300/200' },
        { name: 'Lẩu thái hải sản', description: 'Lẩu thái chua cay với hải sản tươi', price: 450000, dietary_tags: [], is_available: true, image_url: 'https://picsum.photos/seed/lauthaihaisan/300/200' },
        { name: 'Mực xào cần tỏi', description: 'Mực tươi xào giòn với cần tây và tỏi', price: 175000, dietary_tags: [], is_available: false, image_url: 'https://picsum.photos/seed/muxao/300/200' },
      ],
    },
    // --- Đồ uống (Toàn chuỗi) ---
    {
      branch_id: null,
      category_name: 'Đồ Uống',
      items: [
        { name: 'Sinh tố bơ', description: 'Sinh tố bơ béo ngậy, thêm sữa đặc', price: 55000, dietary_tags: ['vegetarian'], is_available: true, image_url: 'https://picsum.photos/seed/sinhtobuo/300/200' },
        { name: 'Nước ép dứa', description: 'Nước ép dứa tươi mát tự nhiên', price: 45000, dietary_tags: ['vegan', 'gluten-free'], is_available: true, image_url: 'https://picsum.photos/seed/nuocepdua/300/200' },
        { name: 'Trà đào cam sả', description: 'Trà đào thơm ngon pha cam sả', price: 49000, dietary_tags: [], is_available: true, image_url: 'https://picsum.photos/seed/tradao/300/200' },
        { name: 'Bia Tiger', description: 'Bia Tiger lon 330ml lạnh', price: 35000, dietary_tags: [], is_available: true, image_url: 'https://picsum.photos/seed/biatiger/300/200' },
      ],
    },
    // --- Tráng miệng (Toàn chuỗi) ---
    {
      branch_id: null,
      category_name: 'Tráng Miệng',
      items: [
        { name: 'Chè khúc bạch', description: 'Chè khúc bạch mát lạnh với topping đa dạng', price: 65000, dietary_tags: ['vegetarian'], is_available: true, image_url: 'https://picsum.photos/seed/chekhucbach/300/200' },
        { name: 'Kem dừa', description: 'Kem dừa tươi đặc sản Việt Nam', price: 45000, dietary_tags: ['vegetarian', 'gluten-free'], is_available: true, image_url: 'https://picsum.photos/seed/kemdua/300/200' },
      ],
    },
  ]);
  console.log(`🍽️  Đã tạo ${menus.length} menu categories (${menus.reduce((s, m) => s + m.items.length, 0)} món ăn)`);

  // ============================================================
  // 4. VOUCHERS
  // ============================================================
  const vouchers = await Voucher.insertMany([
    {
      code: 'SPOTON20',
      branch_id: null,
      discount_percentage: 20,
      max_discount_amount: 100000,
      min_order_value: 300000,
      valid_from: new Date('2026-01-01'),
      valid_until: new Date('2026-12-31'),
      usage_limit: 100,
      used_count: 12,
      is_active: true,
    },
    {
      code: 'NEWCUSTOMER',
      branch_id: null,
      discount_percentage: 30,
      max_discount_amount: 150000,
      min_order_value: 200000,
      valid_from: new Date('2026-06-01'),
      valid_until: new Date('2026-06-30'),
      usage_limit: 50,
      used_count: 5,
      is_active: true,
    },
    {
      code: 'Q1WEEKEND',
      branch_id: branches[0]._id,
      discount_percentage: 15,
      max_discount_amount: 80000,
      min_order_value: 250000,
      valid_from: new Date('2026-06-01'),
      valid_until: new Date('2026-08-31'),
      usage_limit: 200,
      used_count: 43,
      is_active: true,
    },
  ]);
  console.log(`🎟️  Đã tạo ${vouchers.length} vouchers`);

  // ============================================================
  // 5. BOOKINGS (mẫu)
  // ============================================================
  // (giữ nguyên phần bookings cũ)
  const bookings = await Booking.insertMany([
    {
      customer_id: users[3]._id, // khachhang01
      branch_id: branches[0]._id,
      reservation_date: new Date('2026-06-05'),
      arrival_time: '19:00',
      guest_count: 4,
      status: 'CONFIRMED',
      note: 'Cần bàn view đẹp, kỷ niệm ngày cưới',
      assigned_tables: [{ zone_name: 'Sân thượng - Ngoài trời', table_number: 'ST03' }],
      order_items: [
        { name: 'Gỏi cuốn tôm thịt', quantity: 2, price_at_time: 65000, prep_status: 'PENDING', type: 'PRE_ORDER' },
        { name: 'Bò nướng lá lốt', quantity: 1, price_at_time: 195000, prep_status: 'PENDING', type: 'PRE_ORDER' },
      ],
      payment_info: {
        transaction_id: 'VNP20260605001',
        total_amount: 325000,
        deposit_amount: 100000,
        method: 'VNPAY',
        status: 'PAID',
        voucher_code: 'SPOTON20',
        discount_amount: 50000,
        paid_at: new Date(),
      },
    },
    {
      customer_id: users[4]._id, // khachhang02
      branch_id: branches[0]._id,
      reservation_date: new Date('2026-06-03'),
      arrival_time: '18:30',
      guest_count: 2,
      status: 'COMPLETED',
      assigned_tables: [{ zone_name: 'Tầng 1 - Trong nhà', table_number: 'T101' }],
      order_items: [],
      payment_info: {
        total_amount: 220000,
        deposit_amount: 50000,
        method: 'CASH',
        status: 'PAID',
        discount_amount: 0,
      },
    },
    {
      walk_in_name: 'Nguyễn Văn A',
      walk_in_phone: '0912345678',
      branch_id: branches[1]._id,
      reservation_date: new Date('2026-06-04'),
      arrival_time: '12:00',
      guest_count: 6,
      status: 'PENDING_DEPOSIT',
      assigned_tables: [{ zone_name: 'Khu gia đình', table_number: 'GD03' }],
      order_items: [],
      payment_info: { status: 'PENDING', deposit_amount: 150000 },
    },
  ]);
  console.log(`📋 Đã tạo ${bookings.length} bookings`);

  // ============================================================
  // 6. FEEDBACKS
  // ============================================================
  const feedbacks = await Feedback.insertMany([
    {
      booking_id: bookings[1]._id, // booking COMPLETED
      branch_id: branches[0]._id,
      customer_id: users[4]._id,
      rating: 5,
      comment: 'Đồ ăn rất ngon, phục vụ nhiệt tình! Sẽ quay lại lần sau.',
      reply_comment: 'Cảm ơn bạn đã tin tưởng SpotOn! Hẹn gặp lại 🙏',
      is_hidden: false,
    },
    {
      booking_id: bookings[1]._id,
      branch_id: branches[0]._id,
      customer_id: users[3]._id,
      rating: 4,
      comment: 'Không gian đẹp, view sân thượng tuyệt vời. Món bò nướng hơi mặn một chút.',
      reply_comment: null,
      is_hidden: false,
    },
  ]);
  console.log(`⭐ Đã tạo ${feedbacks.length} feedbacks`);

  // ============================================================
  // 7. NOTIFICATIONS
  // ============================================================
  const notifications = await Notification.insertMany([
    {
      user_id: users[3]._id,
      type: 'BOOKING_UPDATE',
      title: 'Đặt bàn đã được xác nhận!',
      content: 'Đặt bàn ngày 05/06/2026 lúc 19:00 tại SpotOn Quận 1 đã được xác nhận. Hẹn gặp bạn!',
      is_read: false,
    },
    {
      user_id: users[3]._id,
      type: 'REMINDER',
      title: 'Nhắc nhở: Đặt bàn tối nay!',
      content: 'Bạn có đặt bàn lúc 19:00 tối nay tại SpotOn Quận 1. Đừng quên nhé!',
      is_read: true,
    },
    {
      user_id: users[4]._id,
      type: 'PROMO',
      title: '🎉 Ưu đãi mới! Giảm 30% cho khách hàng mới',
      content: 'Dùng mã NEWCUSTOMER để được giảm 30% cho đơn đầu tiên. Áp dụng đến hết tháng 6!',
      is_read: false,
    },
    {
      user_id: users[1]._id, // Manager
      type: 'OVERLOAD_ALERT',
      title: '⚠️ Chi nhánh Q1 sắp đầy!',
      content: 'Chi nhánh Quận 1 đang ở mức 88% công suất. Cần kiểm tra và điều phối.',
      is_read: false,
    },
  ]);
  console.log(`🔔 Đã tạo ${notifications.length} notifications`);

  // ============================================================
  // 8. WAITLIST
  // ============================================================
  const waitlist = await Waitlist.insertMany([
    {
      branch_id: branches[0]._id,
      customer_id: users[3]._id,
      guest_count: 3,
      status: 'WAITING',
      joined_at: new Date(),
    },
    {
      branch_id: branches[0]._id,
      customer_id: null,
      walk_in_name: 'Trần Văn Bình',
      walk_in_phone: '0987654321',
      guest_count: 5,
      status: 'NOTIFIED',
      joined_at: new Date(Date.now() - 15 * 60 * 1000), // 15 phút trước
    },
  ]);
  console.log(`⏳ Đã tạo ${waitlist.length} waitlist entries`);

  // ============================================================
  // 9. ARTICLES
  // ============================================================
  const articles = await Article.insertMany([
    {
      author_id: users[0]._id, // Admin
      title: 'SpotOn khai trương chi nhánh mới tại Quận 7!',
      content: '<p>SpotOn tự hào công bố khai trương chi nhánh thứ 2 tại <strong>Phú Mỹ Hưng, Quận 7</strong>. Với không gian sang trọng và view hồ bơi tuyệt đẹp, đây hứa hẹn sẽ là điểm đến lý tưởng cho các bữa ăn gia đình cuối tuần.</p>',
      image_url: 'https://picsum.photos/seed/article1/800/400',
      is_published: true,
      tags: ['khai trương', 'sự kiện', 'quận 7'],
    },
    {
      author_id: users[0]._id,
      title: 'Ưu đãi mùa hè 2026 - Giảm đến 30%!',
      content: '<p>Chào hè 2026, SpotOn mang đến chương trình khuyến mãi đặc biệt với mã giảm giá <strong>SPOTON20</strong> - Giảm 20% cho mọi đơn từ 300.000đ. Áp dụng toàn bộ chi nhánh trong tháng 6.</p>',
      image_url: 'https://picsum.photos/seed/article2/800/400',
      is_published: true,
      tags: ['khuyến mãi', 'mùa hè', 'giảm giá'],
    },
    {
      author_id: users[1]._id, // Manager
      title: 'Thực đơn mới tháng 7 - Thêm 10 món đặc sản miền Tây',
      content: '<p>Tháng 7 này SpotOn bổ sung thực đơn với 10 món đặc sản miền Tây chính gốc, mang đến trải nghiệm ẩm thực mới lạ và phong phú cho thực khách.</p>',
      image_url: 'https://picsum.photos/seed/article3/800/400',
      is_published: false, // Draft chưa đăng
      tags: ['thực đơn', 'miền tây', 'món mới'],
    },
  ]);
  console.log(`📰 Đã tạo ${articles.length} articles`);

  // ============================================================
  // 10. SYSTEM CONFIG
  // ============================================================
  const configs = await SystemConfig.insertMany([
    {
      config_key: 'HOLDING_TIMEOUT_MINUTES',
      config_value: '10',
      description: 'Thời gian giữ bàn (HOLDING) trước khi tự giải phóng (phút)',
    },
    {
      config_key: 'LOCKED_TIMEOUT_MINUTES',
      config_value: '10',
      description: 'Thời gian chờ VNPay thanh toán (LOCKED) trước khi hủy (phút)',
    },
    {
      config_key: 'PREORDER_MIN_HOURS_BEFORE',
      config_value: '2',
      description: 'Số giờ tối thiểu trước giờ đặt để được phép pre-order món ăn',
    },
    {
      config_key: 'DEFAULT_DEPOSIT_PERCENTAGE',
      config_value: '30',
      description: 'Phần trăm đặt cọc mặc định khi đặt bàn (%)',
    },
    {
      config_key: 'MAX_GUESTS_PER_BOOKING',
      config_value: '20',
      description: 'Số khách tối đa trong 1 booking',
    },
  ]);
  console.log(`⚙️  Đã tạo ${configs.length} system configs`);

  // ============================================================
  // TỔNG KẾT
  // ============================================================
  console.log('\n✅ Seed hoàn tất! 10/10 Collections trong Atlas:');
  console.log('   • users        :', users.length, 'documents');
  console.log('   • branches     :', branches.length, 'documents');
  console.log('   • menus        :', menus.length, 'documents');
  console.log('   • vouchers     :', vouchers.length, 'documents');
  console.log('   • bookings     :', bookings.length, 'documents');
  console.log('   • feedbacks    :', feedbacks.length, 'documents');
  console.log('   • notifications:', notifications.length, 'documents');
  console.log('   • waitlists    :', waitlist.length, 'documents');
  console.log('   • articles     :', articles.length, 'documents');
  console.log('   • systemconfigs:', configs.length, 'documents');
  console.log('\n🔑 Tài khoản test (password: Spoton@123):');
  console.log('   ADMIN   :', 'admin@spoton.vn');
  console.log('   MANAGER :', 'manager.q1@spoton.vn');
  console.log('   WAITER  :', 'waiter01@spoton.vn');
  console.log('   CUSTOMER:', 'khachhang01@gmail.com');
  console.log('');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed thất bại:', err.message);
  process.exit(1);
});
