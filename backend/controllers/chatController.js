const Chat = require("../models/Chat");

/* ================= ADMIN ================= */

// 🔥 SIDEBAR: DANH SÁCH KHÁCH (Giữ nguyên logic của bạn)
exports.listThreadsAdmin = (req, res) => {
  Chat.listThreadsForAdmin((err, rows) => {
    if (err) {
      console.error("LIST THREADS ERR:", err);
      return res.status(500).json({ message: "Lỗi threads" });
    }
    res.json(rows);
  });
};

// 🔥 LOAD TIN NHẮN (Giữ nguyên logic của bạn)
exports.getThreadMessagesAdmin = (req, res) => {
  Chat.getMessages(req.params.threadId, 100, (err, rows) => {
    if (err) {
      console.error("GET MESSAGES ERR:", err);
      return res.status(500).json({ message: "Lỗi messages" });
    }
    res.json(rows);
  });
};

// 🔥 ADMIN GỬI TIN (✅ CẬP NHẬT REAL-TIME)
exports.sendMessageAdmin = (req, res) => {
  const { content } = req.body;
  const threadId = req.params.threadId;

  if (!content?.trim()) {
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
        console.error("SEND ADMIN MSG ERR:", err);
        return res.status(500).json({ message: "Lỗi gửi tin" });
      }

      // ✅ PHÁT TÍN HIỆU REAL-TIME ĐẾN KHÁCH HÀNG
      if (global.io) {
        global.io.to(threadId).emit("new_message", {
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
};

// 🔥 ĐƠN HÀNG CỦA USER (Giữ nguyên logic của bạn)
exports.getOrdersSummaryOfUserAdmin = (req, res) => {
  Chat.getOrdersSummaryByUserId(req.params.userId, (err, rows) => {
    if (err) {
      console.error("GET ORDERS ERR:", err);
      return res.status(500).json({ message: "Lỗi orders" });
    }
    res.json(rows);
  });
};

/* ================= CUSTOMER ================= */

// 🔥 LẤY THREAD CỦA TÔI
exports.getMyThread = (req, res) => {
  Chat.getOrCreateThreadByUserId(req.user.id, (err, thread) => {
    if (err) return res.status(500).json({ message: "Lỗi lấy thread" });
    res.json(thread);
  });
};

// 🔥 KHÁCH GỬI TIN (✅ CẬP NHẬT REAL-TIME)
exports.sendMessageUser = (req, res) => {
  const { threadId, content } = req.body;

  if (!content?.trim() || !threadId) {
    return res.status(400).json({ message: "Thiếu thông tin" });
  }

  Chat.createMessage(
    {
      threadId: threadId,
      senderRole: "USER",
      senderId: req.user.id,
      message: content,
      type: "text",
    },
    (err, result) => {
      if (err) return res.status(500).json({ message: "Lỗi gửi tin" });

      // ✅ PHÁT TÍN HIỆU REAL-TIME ĐẾN ADMIN
      if (global.io) {
        global.io.to(threadId).emit("new_message", {
          id: result.insertId || Date.now(),
          threadId: threadId,
          sender_role: "USER",
          message: content,
          created_at: new Date(),
        });
      }

      res.json({ success: true });
    },
  );
};
