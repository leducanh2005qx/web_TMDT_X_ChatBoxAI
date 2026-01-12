const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const Chat = require("../models/Chat");

/* =====================================================
   ADMIN – LIST THREADS (SIDEBAR)
   👉 FIX: dùng đúng hàm listThreadsForAdmin
===================================================== */
router.get("/admin/threads", authMiddleware, adminMiddleware, (req, res) => {
  Chat.listThreadsForAdmin((err, rows) => {
    if (err) {
      console.error("LIST THREADS ERR:", err);
      return res.status(500).json({ message: "Lỗi lấy danh sách chat" });
    }
    res.json(rows || []);
  });
});

/* =====================================================
   ADMIN – GET MESSAGES BY THREAD
===================================================== */
router.get(
  "/admin/messages/:threadId",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    Chat.getMessages(req.params.threadId, 100, (err, rows) => {
      if (err) {
        console.error("GET MESSAGES ERR:", err);
        return res.status(500).json({ message: "Lỗi lấy tin nhắn" });
      }
      res.json(rows || []);
    });
  }
);

/* =====================================================
   ADMIN – SEND MESSAGE
===================================================== */
router.post(
  "/admin/messages/:threadId",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Nội dung trống" });
    }

    Chat.createMessage(
      {
        threadId: req.params.threadId,
        senderRole: "ADMIN",
        senderId: req.user.id,
        message: content,
        type: "text",
      },
      (err) => {
        if (err) {
          console.error("SEND MESSAGE ERR:", err);
          return res.status(500).json({ message: "Lỗi gửi tin nhắn" });
        }
        res.json({ success: true });
      }
    );
  }
);

/* =====================================================
   ADMIN – ORDERS IN CHAT
===================================================== */
router.get(
  "/admin/orders/:userId",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    Chat.getOrdersSummaryByUserId(req.params.userId, (err, rows) => {
      if (err) {
        console.error("GET ORDERS ERR:", err);
        return res.status(500).json({ message: "Lỗi lấy đơn hàng" });
      }
      res.json(rows || []);
    });
  }
);

module.exports = router;
