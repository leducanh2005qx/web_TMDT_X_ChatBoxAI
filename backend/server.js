// 🔥 PHẢI ĐỂ DÒNG NÀY ĐẦU TIÊN
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC FILE ================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= ROUTES ================= */
// ⚠️ ADMIN PHẢI ĐỨNG TRƯỚC
app.use("/api/orders/admin", adminOrderRoutes); // ✅ ADMIN
app.use("/api/orders", orderRoutes); // ✅ USER

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", require("./routes/categoryRoutes"));

/* ================= SERVER ================= */
app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});
