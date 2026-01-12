const Chat = require("../models/Chat");

/* ================= USER ================= */
exports.getMyThread = (req, res) => {
  Chat.getOrCreateThreadByUserId(req.user.id, (err, thread) => {
    if (err) return res.status(500).json({ message: "Lỗi thread" });
    res.json(thread);
  });
};

exports.getMyMessages = (req, res) => {
  Chat.getOrCreateThreadByUserId(req.user.id, (err, thread) => {
    if (err) return res.status(500).json({ message: "Lỗi thread" });

    Chat.getMessages(thread.id, 50, (err2, rows) => {
      if (err2) return res.status(500).json({ message: "Lỗi messages" });
      res.json(rows);
    });
  });
};

/* ================= ADMIN ================= */
exports.listThreadsAdmin = (req, res) => {
  Chat.listThreadsForAdmin((err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi threads" });
    res.json(rows);
  });
};

exports.getOrdersSummaryOfUserAdmin = (req, res) => {
  Chat.getOrdersSummaryByUserId(req.params.userId, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi orders" });
    res.json(rows);
  });
};
