const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");

// Lấy số lượng thông báo chưa đọc
router.get("/unread", authMiddleware, notificationController.getUnreadCount);

// Lấy danh sách thông báo
router.get("/", authMiddleware, notificationController.getUserNotifications);

// Đánh dấu tất cả thông báo của user này là đã đọc
router.put("/mark-read", authMiddleware, notificationController.markAsRead);

module.exports = router;
