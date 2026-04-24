const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const isAdmin = require("../middlewares/isAdmin");
const orderController = require("../controllers/orderController");

/*
  ⚠️ THỨ TỰ ROUTE RẤT QUAN TRỌNG
  Các route cụ thể PHẢI đặt trước "/:id"
*/

// ✅ Middleware: bắt buộc đăng nhập + ADMIN
// ✅ Middleware: bắt buộc đăng nhập + ADMIN
router.use(authMiddleware);
const canViewOrders = roleMiddleware(["ADMIN", "MANAGER", "STAFF"]);
const canManageOrders = roleMiddleware(["ADMIN", "MANAGER", "STAFF"]);

/* ================= STATISTICS ================= */

// 📊 Thống kê doanh thu & tổng đơn (chỉ completed)
router.get("/stats", roleMiddleware(["ADMIN", "MANAGER"]), orderController.getStatistics);

// 🔥 Sản phẩm bán chạy
router.get("/best-products", roleMiddleware(["ADMIN", "MANAGER"]), orderController.getBestSellingProducts);

// 💰 Top 5 lợi nhuận
router.get("/top-profit-products", roleMiddleware(["ADMIN", "MANAGER"]), orderController.getTopProfitProducts);

// ⏳ Đơn hàng chưa hoàn thành (pending + confirmed)
router.get("/uncompleted", roleMiddleware(["ADMIN", "MANAGER"]), orderController.getUncompletedOrders);

// 📈 Doanh thu theo danh mục
router.get("/category-revenue", roleMiddleware(["ADMIN", "MANAGER"]), orderController.getCategoryRevenue);

// 📅 Doanh thu theo tháng & tuần
router.get("/monthly-revenue", roleMiddleware(["ADMIN", "MANAGER"]), orderController.getMonthlyRevenue);
router.get("/weekly-revenue", roleMiddleware(["ADMIN", "MANAGER"]), orderController.getWeeklyRevenue);
router.get("/customer-growth", roleMiddleware(["ADMIN", "MANAGER"]), orderController.getMonthlyCustomerGrowth);

/* ================= ORDERS ================= */

// 📦 Lấy danh sách tất cả đơn hàng
router.get("/", canViewOrders, orderController.getAllOrdersAdmin);

// 🔄 Cập nhật trạng thái đơn hàng
router.put("/:id/status", canManageOrders, orderController.updateOrderStatus);

module.exports = router;
