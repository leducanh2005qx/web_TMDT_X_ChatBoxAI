const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

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

      if (global.io) {
        global.io.to(String(tId)).emit("new_message", {
          id: result.insertId || Date.now(),
          threadId: tId,
          sender_role: "USER",
          message: content,
          created_at: new Date(),
        });
        global.io.to(String(tId)).emit("newMessage", {
          id: result.insertId || Date.now(),
          threadId: tId,
          sender_role: "USER",
          message: content,
          created_at: new Date(),
        });
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
===================================================== */
router.post("/ai/suggest/:threadId", authMiddleware, canSupportChat, async (req, res) => {
  const { threadId } = req.params;
  try {
    // 1. Get recent messages
    Chat.getMessages(threadId, 10, async (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi lấy tin nhắn cho AI" });
      
      const historyText = rows.map(m => `${m.sender_role === "USER" ? "Khách hàng" : "Nhân viên"}: ${m.message}`).join("\n");
      
      // 2. Call Google Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ message: "Chưa cấu hình GEMINI_API_KEY ở server" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Bạn là một nhân viên chăm sóc khách hàng xuất sắc của Tiger Shop. Hãy đọc lịch sử trò chuyện sau và đề xuất MỘT câu trả lời TRỰC TIẾP, ngắn gọn, lịch sự, nhiệt tình để phản hồi cho khách hàng. Không cần giải thích thêm.\n\nLịch sử chat:\n${historyText}\n\nĐề xuất câu trả lời:`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      res.json({ suggestion: response.text });
    });
  } catch (error) {
    console.error("AI SUGGEST ERR:", error);
    res.status(500).json({ message: "Lỗi tạo gợi ý AI" });
  }
});

module.exports = router;
