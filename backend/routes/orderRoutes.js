const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const orderController = require("../controllers/orderController");

/* ================= USER ORDERS ================= */

// ✅ TẠO ĐƠN
router.post("/", authMiddleware, orderController.createOrder);

// ✅ LẤY ĐƠN CỦA USER
router.get("/my", authMiddleware, orderController.getOrdersByUser);

// ✅ CHI TIẾT ĐƠN
router.get("/:id", authMiddleware, orderController.getOrderDetail);

module.exports = router;
