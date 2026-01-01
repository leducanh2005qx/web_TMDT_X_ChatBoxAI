const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

// ================= CUSTOMER =================

// Tạo đơn
router.post("/", authMiddleware, orderController.createOrder);

// Danh sách đơn của user
router.get("/my", authMiddleware, orderController.getOrdersByUser);

// 🔥 CHI TIẾT ĐƠN HÀNG (BẮT BUỘC)
router.get("/:id", authMiddleware, orderController.getOrderDetail);

// ================= ADMIN =================

router.get(
  "/admin",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Không có quyền admin" });
    }
    next();
  },
  orderController.getAllOrders
);

router.get(
  "/admin/stats",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Không có quyền admin" });
    }
    next();
  },
  orderController.getOrderStats
);

module.exports = router;
