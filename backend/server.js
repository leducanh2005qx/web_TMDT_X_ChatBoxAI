const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
require("dotenv").config();
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per window
  message: { message: "Bạn gửi lện quá nhanh, vui lòng đợi 1 phút!" }
});

/* ================= ROUTES ================= */
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const chatRoutes = require("./routes/chatRoutes");
const adminChatRoutes = require("./routes/adminChatRoutes");
const variantRoutes = require("./routes/variantRoutes");
const voucherRoutes = require("./routes/voucherRoutes");
const userVoucherRoutes = require("./routes/userVoucherRoutes");
const shiftRoutes = require("./routes/shiftRoutes");

/* ================= SOCKET ================= */
const { initSocket } = require("./socket");

/* ================= APP ================= */
const app = express();
const server = http.createServer(app);

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= API ROUTES ================= */
app.use("/api/auth", apiLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/vouchers", voucherRoutes);
app.use("/api/user-vouchers", userVoucherRoutes);
app.use("/api/orders/admin", adminOrderRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/chat/admin", adminChatRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/shifts", shiftRoutes);

/* ================= SOCKET INIT ================= */
// Chỉnh sửa tại đây: Lưu io vào global
const io = initSocket(server);
global.io = io;

/* ================= VOUCHER AUTOMATION ================= */
const { giftBirthdayVouchers, getVoucherStats } = require("./services/voucherService");

// API: Thống kê voucher cho AI Tiger
app.get("/api/voucher-stats", (req, res) => {
  getVoucherStats((err, stats) => {
    if (err) return res.status(500).json({ message: "Lỗi thống kê voucher" });
    res.json(stats);
  });
});

// Cron: Quét sinh nhật mỗi ngày lúc 00:05 (chạy khi server khởi động + mỗi 24h)
const runBirthdayCron = () => {
  console.log("🎂 [CRON] Đang quét sinh nhật khách hàng...");
  giftBirthdayVouchers((err, count) => {
    if (err) console.error("🎂 [CRON] Lỗi:", err.message);
    else console.log(`🎂 [CRON] Đã tặng ${count} mã Birthday Voucher hôm nay.`);
  });
};

// Chạy lần đầu sau 5 giây khi server khởi động
setTimeout(runBirthdayCron, 5000);
// Lặp lại mỗi 24 giờ
setInterval(runBirthdayCron, 24 * 60 * 60 * 1000);

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
