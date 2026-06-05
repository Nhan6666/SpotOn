require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// =============================================
// IMPORT ROUTES (Uncomment dần khi implement)
// =============================================
// const authRoutes     = require('./routes/authRoutes');
// const userRoutes     = require('./routes/userRoutes');
const branchRoutes   = require('./routes/branchRoutes');
const userRoutes     = require('./routes/userRoutes');
// const menuRoutes     = require('./routes/menuRoutes');
// const bookingRoutes  = require('./routes/bookingRoutes');
// const voucherRoutes  = require('./routes/voucherRoutes');
// const feedbackRoutes = require('./routes/feedbackRoutes');
// const waitlistRoutes = require('./routes/waitlistRoutes');
// const articleRoutes  = require('./routes/articleRoutes');
// const notifRoutes    = require('./routes/notificationRoutes');

// =============================================
// KHỞI TẠO APP
// =============================================
const app = express();

// Kết nối Database
connectDB();

// =============================================
// MIDDLEWARES
// =============================================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// ROUTES
// =============================================
// Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SpotOn API is running smoothly! 🚀',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes (Uncomment dần khi implement)
// app.use('/api/v1/auth',          authRoutes);
// app.use('/api/v1/users',         userRoutes);
app.use('/api/v1/branches',      branchRoutes);
app.use('/api/v1/users',         userRoutes);
// app.use('/api/v1/menus',         menuRoutes);
// app.use('/api/v1/bookings',      bookingRoutes);
// app.use('/api/v1/vouchers',      voucherRoutes);
// app.use('/api/v1/feedbacks',     feedbackRoutes);
// app.use('/api/v1/waitlist',      waitlistRoutes);
// app.use('/api/v1/articles',      articleRoutes);
// app.use('/api/v1/notifications', notifRoutes);

// =============================================
// GLOBAL ERROR HANDLERS
// =============================================
// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// =============================================
// CHẠY SERVER
// =============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in [${process.env.NODE_ENV || 'development'}] mode on port ${PORT}`);
});
