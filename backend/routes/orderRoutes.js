const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const orderController = require("../controllers/orderController");

// ➕ Tạo đơn hàng
router.post("/", authMiddleware, orderController.createOrder);

// 📜 Đơn hàng của user
router.get("/my", authMiddleware, orderController.getOrdersByUser);

// 🔍 Chi tiết đơn hàng (USER)
router.get("/:id", authMiddleware, orderController.getOrderDetail);

module.exports = router;
