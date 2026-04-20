const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucherController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// ✅ Áp dụng voucher cho khách hàng (Public - PHẢI đặt trước /:id)
router.post("/apply", voucherController.apply);

// ✅ Lấy danh sách công khai (Customer)
router.get("/public", authMiddleware, voucherController.getAvailable);

// ✅ Lấy danh sách (Admin/Manager)
router.get("/", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), voucherController.getAll);

// ✅ Tạo voucher mới (Admin/Manager)
router.post("/", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), voucherController.create);

// ✅ Cập nhật voucher (Admin/Manager)
router.put("/:id", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), voucherController.update);

// ✅ Bật/Tắt trạng thái (Admin/Manager)
router.put("/:id/toggle", authMiddleware, roleMiddleware(["ADMIN", "MANAGER"]), voucherController.toggle);

module.exports = router;
