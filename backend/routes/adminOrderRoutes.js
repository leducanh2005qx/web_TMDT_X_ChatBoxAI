const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const orderController = require("../controllers/orderController");

/**
 * BASE PATH: /api/orders/admin
 * Không dùng role – chỉ cần đăng nhập
 */

// 📦 Xem tất cả đơn hàng
router.get("/", authMiddleware, orderController.getAllOrdersAdmin);

// 📊 Thống kê (⚠️ PHẢI ĐỂ TRƯỚC /:id)
router.get("/stats", authMiddleware, orderController.getStatistics);

// 🔍 Xem chi tiết đơn hàng
router.get("/:id", authMiddleware, orderController.getOrderDetailAdmin);

// 🔄 Cập nhật trạng thái đơn hàng
router.put("/:id/status", authMiddleware, orderController.updateOrderStatus);

module.exports = router;
