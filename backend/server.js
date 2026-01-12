const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
require("dotenv").config();

/* ================= ROUTES ================= */
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes"); // ADMIN ORDERS
const categoryRoutes = require("./routes/categoryRoutes");
const chatRoutes = require("./routes/chatRoutes");

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
app.use("/api/products", productRoutes);

/**
 * ⚠️ RẤT QUAN TRỌNG
 * admin orders PHẢI đứng TRƯỚC /api/orders
 * nếu không sẽ bị ăn nhầm route
 */
app.use("/api/orders/admin", adminOrderRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/categories", categoryRoutes);
app.use("/api/chat", chatRoutes);

/* ================= SOCKET INIT ================= */
initSocket(server);

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend + Socket + Chat running on http://localhost:${PORT}`);
});
