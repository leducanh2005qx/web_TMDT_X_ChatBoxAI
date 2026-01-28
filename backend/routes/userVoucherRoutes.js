const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const controller = require("../controllers/userVoucherController");

// danh sách voucher có thể nhận
router.get("/available", auth, controller.getAvailable);

// nhận voucher
router.post("/receive/:voucherId", auth, controller.receiveVoucher);

// voucher đã nhận (để checkout)
router.get("/my", auth, controller.getMyVouchers);

module.exports = router;
