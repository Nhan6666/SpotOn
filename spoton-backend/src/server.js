require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const connectDB = require("./config/db");

// =============================================
// IMPORT ROUTES (Uncomment dần khi implement)
// =============================================
const authRoutes = require("./routes/authRoutes");
const branchRoutes = require("./routes/branchRoutes");
const userRoutes = require("./routes/userRoutes");
const menuRoutes = require("./routes/menuRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const mapTemplateRoutes = require("./routes/mapTemplateRoutes");
const managerMenuRoutes = require("./routes/managerMenuRoutes");
const voucherRoutes = require("./routes/voucherRoutes");
const systemConfigRoutes = require("./routes/systemConfigRoutes");
const amenityRoutes = require("./routes/amenityRoutes");
const statsRoutes = require("./routes/statsRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const receptionRoutes = require("./routes/receptionRoutes");
const orderRoutes = require("./routes/orderRoutes");
const financeRoutes = require("./routes/financeRoutes");

// =============================================
// KHỞI TẠO APP
// =============================================
const app = express();

// Kết nối Database
connectDB();

// Kết nối Redis (Two-Stage Locking)
require("./config/redis");

// =============================================
// MIDDLEWARES
// =============================================
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép mọi origin (hỗ trợ test trên localhost và cả IP LAN như 192.168.x.x)
      callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// =============================================
// ROUTES
// =============================================
// Health Check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "SpotOn API is running smoothly! 🚀",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/branches", branchRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/menus", menuRoutes);
app.use("/api/v1/manager/menus", managerMenuRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/map-templates", mapTemplateRoutes);
app.use("/api/v1/vouchers", voucherRoutes);
app.use("/api/v1/system-configs", systemConfigRoutes);
app.use("/api/v1/amenities", amenityRoutes);
app.use("/api/v1/stats", statsRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reception", receptionRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/finance", financeRoutes);

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

// Error Handler Middleware
const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

// =============================================
// CHẠY SERVER & SOCKET.IO
// =============================================
const PORT = process.env.PORT || 5000;
const http = require("http");
const server = http.createServer(app);

const io = require("./socket").init(server);

io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on("join_branch_room", (branchId) => {
    // Only allow if socket has a token (simple auth check for real-time safety)
    if (!socket.handshake.query.token && !socket.handshake.auth?.token) {
      console.warn(`Socket ${socket.id} attempted to join without auth.`);
      // return; // Commented out to not break dev, but should be enabled in prod
    }
    socket.join(`branch_${branchId}`);
    socket.join(`branch_${branchId}_kitchen`);
    console.log(`Client ${socket.id} joined room: branch_${branchId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(
    `🚀 Server running in [${process.env.NODE_ENV || "development"}] mode on port ${PORT}`,
  );

  // Khởi chạy System Workers (UC-S01 + UC-S02)
  const cronService = require("./services/cronService");
  cronService.start();
});
