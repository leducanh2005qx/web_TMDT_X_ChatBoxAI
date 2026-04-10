const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const Chat = require("../models/Chat");
const canSupportChat = roleMiddleware(["ADMIN", "STAFF"]);

/* =====================================================
   ADMIN – LIST THREADS (SIDEBAR)
   Lấy danh sách các cuộc hội thoại hiển thị ở cột trái
===================================================== */
router.get("/admin/threads", authMiddleware, canSupportChat, (req, res) => {
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
   Load lịch sử tin nhắn khi click vào một khách hàng
===================================================== */
router.get(
  "/admin/messages/:threadId",
  authMiddleware,
  canSupportChat,
  (req, res) => {
    const threadId = req.params.threadId;

    // Kiểm tra threadId hợp lệ trước khi load
    if (!threadId || threadId === "undefined") {
      return res.status(400).json({ message: "Thread ID không hợp lệ" });
    }

    Chat.getMessages(threadId, 100, (err, rows) => {
      if (err) {
        console.error("GET MESSAGES ERR:", err);
        return res.status(500).json({ message: "Lỗi lấy tin nhắn" });
      }
      res.json(rows || []);
    });
  },
);

/* =====================================================
   ADMIN – SEND MESSAGE (✅ FIX LỖI UNDEFINED & REAL-TIME)
   Gửi tin nhắn từ Admin đến Khách hàng
===================================================== */
router.post(
  "/admin/messages/:threadId",
  authMiddleware,
  canSupportChat,
  (req, res) => {
    const { content } = req.body;

    // 🔥 FIX: Ép kiểu threadId sang Integer để tránh lỗi MySQL 'undefined'
    const threadId = parseInt(req.params.threadId);

    if (isNaN(threadId)) {
      console.error("❌ Thread ID nhận được bị undefined hoặc không hợp lệ");
      return res.status(400).json({ message: "Thread ID không hợp lệ" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Nội dung trống" });
    }

    Chat.createMessage(
      {
        threadId: threadId,
        senderRole: "ADMIN",
        senderId: req.user.id,
        message: content,
        type: "text",
      },
      (err, result) => {
        if (err) {
          console.error("SEND MESSAGE ERR:", err);
          return res.status(500).json({ message: "Lỗi gửi tin nhắn" });
        }

        // 🔥 PHÁT TÍN HIỆU REAL-TIME QUA SOCKET
        // Đảm bảo Frontend nhận được tin nhắn ngay lập tức mà không cần F5
        if (global.io) {
          global.io.to(String(threadId)).emit("new_message", {
            id: result.insertId || Date.now(),
            threadId: threadId,
            sender_role: "ADMIN",
            message: content,
            created_at: new Date(),
          });
        }

        res.json({ success: true });
      },
    );
  },
);

/* =====================================================
   ADMIN – ORDERS IN CHAT
   Lấy tóm tắt đơn hàng của khách hàng đang chat ở cột phải
===================================================== */
router.get(
  "/admin/orders/:userId",
  authMiddleware,
  canSupportChat,
  (req, res) => {
    Chat.getOrdersSummaryByUserId(req.params.userId, (err, rows) => {
      if (err) {
        console.error("GET ORDERS ERR:", err);
        return res.status(500).json({ message: "Lỗi lấy đơn hàng" });
      }
      res.json(rows || []);
    });
  },
);

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
