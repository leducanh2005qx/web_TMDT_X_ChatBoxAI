const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const orderController = require("../controllers/orderController");

/* ================= USER ================= */
router.post("/", authMiddleware, orderController.createOrder);
router.get("/my", authMiddleware, orderController.getOrdersByUser);
router.get("/:id", authMiddleware, orderController.getOrderDetail);

/* ================= ADMIN ================= */
router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("ADMIN"),
  orderController.getAllOrdersAdmin
);

router.get(
  "/admin/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  orderController.getOrderDetailAdmin // ✅ THÊM
);

router.put(
  "/admin/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  orderController.updateOrderStatus
);

router.get(
  "/admin/stats",
  authMiddleware,
  roleMiddleware("ADMIN"),
  orderController.getStatistics
);

router.get(
  "/admin/best-selling",
  authMiddleware,
  roleMiddleware("ADMIN"),
  orderController.getBestSellingProducts
);

router.get(
  "/admin/uncompleted",
  authMiddleware,
  roleMiddleware("ADMIN"),
  orderController.getUncompletedOrders
);

module.exports = router;
