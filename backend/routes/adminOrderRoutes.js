const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const orderController = require("../controllers/orderController");

/*
  ⚠️ THỨ TỰ ROUTE RẤT QUAN TRỌNG
  Các route cụ thể PHẢI đặt trước "/:id"
*/

// ✅ Middleware: bắt buộc đăng nhập + ADMIN
router.use(authMiddleware);
const adminOnly = roleMiddleware("ADMIN");
const canViewOrders = roleMiddleware(["ADMIN", "MANAGER", "STAFF"]);
const canManageOrders = roleMiddleware(["ADMIN", "MANAGER"]);

/* ================= STATISTICS ================= */

// 📊 Thống kê doanh thu & tổng đơn (chỉ completed)
router.get("/stats", adminOnly, orderController.getStatistics);

// 🔥 Sản phẩm bán chạy
router.get("/best-products", adminOnly, orderController.getBestSellingProducts);

// ⏳ Đơn hàng chưa hoàn thành (pending + confirmed)
router.get("/uncompleted", adminOnly, orderController.getUncompletedOrders);

/* ================= ORDERS ================= */

// 📦 Lấy danh sách tất cả đơn hàng
router.get("/", canViewOrders, orderController.getAllOrdersAdmin);

// 🔄 Cập nhật trạng thái đơn hàng
router.put("/:id/status", canManageOrders, orderController.updateOrderStatus);

module.exports = router;
