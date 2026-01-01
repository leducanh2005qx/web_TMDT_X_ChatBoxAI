// 🔥 PHẢI ĐỂ DÒNG NÀY ĐẦU TIÊN
require("dotenv").config();

console.log("🔥 SERVER.JS ĐANG CHẠY 🔥");

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC FILE (ẢNH) ================= */
// 👉 để frontend load ảnh: http://localhost:5000/uploads/abc.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

/* ================= SERVER ================= */
app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});
