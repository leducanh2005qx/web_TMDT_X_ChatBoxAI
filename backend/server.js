const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
require("dotenv").config();

/* ================= ROUTES ================= */
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes"); // ✅ ĐÃ SỬA LỖI TẠI ĐÂY
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const chatRoutes = require("./routes/chatRoutes");
const variantRoutes = require("./routes/variantRoutes");
const voucherRoutes = require("./routes/voucherRoutes");

// ✅ NEW: customer nhận voucher
const userVoucherRoutes = require("./routes/userVoucherRoutes");

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
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/variants", variantRoutes);
app.use("/api/vouchers", voucherRoutes);

// ✅ NEW: user vouchers (receive / my)
app.use("/api/user-vouchers", userVoucherRoutes);

app.use("/api/orders/admin", adminOrderRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/chat", chatRoutes);

/* ================= SOCKET INIT ================= */
initSocket(server);

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
