const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const orderController = require("../controllers/orderController");

/* ================= USER ================= */
router.post("/", authMiddleware, orderController.createOrder);
router.get("/my", authMiddleware, orderController.getOrdersByUser);
router.get("/:id", authMiddleware, orderController.getOrderDetail);

// Khách hàng tự hủy đơn khi Pending
router.post("/:id/cancel", authMiddleware, orderController.cancelOrder);

// Staff hủy đơn (bắt buộc reason)
router.post(
  "/staff/:id/cancel",
  authMiddleware,
  roleMiddleware(["STAFF", "MANAGER", "ADMIN"]),
  orderController.cancelOrder
);

/* ================= ADMIN ================= */
router.get(
  "/admin",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  orderController.getAllOrdersAdmin
);

// (Moved /admin/:id to bottom to prevent shadowing)

router.put(
  "/admin/:id/status",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  orderController.updateOrderStatus
);

router.get(
  "/admin/stats",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  orderController.getStatistics
);

router.get(
  "/admin/best-selling",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  orderController.getBestSellingProducts
);

router.get(
  "/admin/uncompleted",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  orderController.getUncompletedOrders
);

router.get(
  "/admin/customer-growth",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  orderController.getMonthlyCustomerGrowth
);

router.get(
  "/admin/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "MANAGER"]),
  orderController.getOrderDetailAdmin // ✅ THÊM
);

module.exports = router;
