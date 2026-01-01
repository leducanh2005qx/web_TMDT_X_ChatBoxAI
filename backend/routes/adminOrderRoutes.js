const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const orderController = require("../controllers/orderController");

router.get(
  "/orders",
  authMiddleware,
  adminMiddleware,
  orderController.getAllOrders
);

router.get(
  "/orders/:id",
  authMiddleware,
  adminMiddleware,
  orderController.getOrderDetail
);

router.put(
  "/orders/:id/status",
  authMiddleware,
  adminMiddleware,
  orderController.updateOrderStatus
);

router.get(
  "/statistics",
  authMiddleware,
  adminMiddleware,
  orderController.getStatistics
);

module.exports = router;
