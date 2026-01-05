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
// ✅ FIX CORS – CHO PHÉP FRONTEND 3000 GỌI BACKEND 5000
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
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes); // USER
app.use("/api/orders/admin", adminOrderRoutes); // ADMIN

/* ================= SERVER ================= */
app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});
