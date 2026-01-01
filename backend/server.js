console.log("🔥 SERVER.JS ĐANG CHẠY 🔥");

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes"); // ✅ import trước

const app = express(); // ✅ KHỞI TẠO APP TRƯỚC

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes); // ✅ đặt SAU khi app đã tồn tại

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
