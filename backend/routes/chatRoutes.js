const express = require("express");
const router = express.Router();
// const { GoogleGenerativeAI } = require("@google/generative-ai"); // 🔇 TẠM TẮT AI

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const Chat = require("../models/Chat");
const chatController = require("../controllers/chatController");
const aiChatController = require("../controllers/aiChatController"); // ✅ THÊM
const upload = require("../middlewares/uploadMiddleware"); // ✅ THÊM
const canSupportChat = roleMiddleware(["ADMIN", "STAFF"]);

/* =====================================================
   CUSTOMER – GET MY THREAD
===================================================== */
router.get("/my-thread", authMiddleware, (req, res) => {
  Chat.getOrCreateThreadByUserId(req.user.id, (err, thread) => {
    if (err) return res.status(500).json({ message: "Lỗi lấy thread" });
    res.json(thread);
  });
});

/* =====================================================
   CUSTOMER – SEND MESSAGE (REAL-TIME)
===================================================== */
router.post("/messages", authMiddleware, (req, res) => {
  const { threadId, content } = req.body;
  const tId = parseInt(threadId);

  if (isNaN(tId) || !content?.trim()) {
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }

  Chat.createMessage(
    {
      threadId: tId,
      senderRole: "USER",
      senderId: req.user.id,
      message: content,
      type: "text",
    },
    (err, result) => {
      if (err) return res.status(500).json({ message: "Lỗi gửi tin" });

      const msgPayload = {
        id: result.insertId || Date.now(),
        threadId: tId,
        sender_role: "USER",
        senderRole: "USER",
        senderId: req.user.id,
        message: content,
        created_at: new Date(),
        createdAt: new Date(),
      };

      if (global.io) {
        global.io.to(String(tId)).emit("receive_message", msgPayload);
        global.io.to(String(tId)).emit("newMessage", msgPayload);
      }
      res.json({ success: true });
    },
  );
});

/* =====================================================
   CUSTOMER – GET MESSAGES (FIX MISSING ROUTE)
===================================================== */
router.get("/messages/:threadId", authMiddleware, (req, res) => {
  const { threadId } = req.params;
  Chat.getMessages(threadId, 100, (err, rows) => {
    if (err) {
      console.error("GET MESSAGES ERR:", err);
      return res.status(500).json({ message: "Lỗi lấy tin nhắn" });
    }
    res.json(rows || []);
  });
});

/* =====================================================
   AI ASSISTANT – SUGGEST RESPONSE
   🔇 TẠM TẮT AI - Trả về gợi ý tĩnh để tránh lỗi 404
===================================================== */
router.post("/ai/suggest/:threadId", authMiddleware, canSupportChat, async (req, res) => {
  res.json({ suggestion: "Dạ cảm ơn sếp đã liên hệ Tiger Shop. Em sẽ hỗ trợ sếp ngay ạ! 🐯" });
});

/* =====================================================
   SWITCH TO HUMAN
===================================================== */
router.post("/switch-to-human", authMiddleware, (req, res) => {
  const { threadId } = req.body;
  if (!threadId) return res.status(400).json({ message: "Thiếu threadId" });

  Chat.updateThreadStatus(threadId, "staff_needed", (err) => {
    if (err) return res.status(500).json({ message: "Lỗi cập nhật trạng thái" });
    
    // Thêm cờ is_human_needed
    const db = require("../config/db");
    db.query("UPDATE threads SET is_human_needed = 1 WHERE id = ?", [threadId], (err2) => {
      if (err2) return res.status(500).json({ message: "Lỗi cập nhật is_human_needed" });
      res.json({ success: true, message: "Đã chuyển sang nhân viên hỗ trợ." });
    });
  });
});

/* =====================================================
   AI STATELESS CHAT
===================================================== */
router.post("/ai/talk", authMiddleware, aiChatController.chatWithAi);

module.exports = router;
