const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucherController");

// ✅ Lấy danh sách từ MySQL
router.get("/", voucherController.getAll);

// ✅ Tạo voucher mới (Dùng hàm create trong controller)
router.post("/", voucherController.create);

// ✅ Bật/Tắt trạng thái
router.put("/:id/toggle", voucherController.toggle);

// ✅ Áp dụng cho khách hàng
router.post("/apply", voucherController.apply);

module.exports = router;
