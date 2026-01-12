const Chat = require("../models/Chat");

/* ================= ADMIN ================= */

// 🔥 SIDEBAR: DANH SÁCH KHÁCH
exports.listThreadsAdmin = (req, res) => {
  Chat.listThreadsForAdmin((err, rows) => {
    if (err) {
      console.error("LIST THREADS ERR:", err);
      return res.status(500).json({ message: "Lỗi threads" });
    }
    res.json(rows);
  });
};

// 🔥 LOAD TIN NHẮN
exports.getThreadMessagesAdmin = (req, res) => {
  Chat.getMessages(req.params.threadId, 100, (err, rows) => {
    if (err) {
      console.error("GET MESSAGES ERR:", err);
      return res.status(500).json({ message: "Lỗi messages" });
    }
    res.json(rows);
  });
};

// 🔥 ADMIN GỬI TIN
exports.sendMessageAdmin = (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
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
        console.error("SEND ADMIN MSG ERR:", err);
        return res.status(500).json({ message: "Lỗi gửi tin" });
      }
      res.json({ success: true });
    }
  );
};

// 🔥 ĐƠN HÀNG CỦA USER
exports.getOrdersSummaryOfUserAdmin = (req, res) => {
  Chat.getOrdersSummaryByUserId(req.params.userId, (err, rows) => {
    if (err) {
      console.error("GET ORDERS ERR:", err);
      return res.status(500).json({ message: "Lỗi orders" });
    }
    res.json(rows);
  });
};
