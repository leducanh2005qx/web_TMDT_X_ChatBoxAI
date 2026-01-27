const db = require("../config/db");

exports.getMe = (req, res) => {
  db.query(
    "SELECT id, name, email, phone FROM users WHERE id = ?",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi server" });
      res.json(rows[0]);
    },
  );
};

exports.updateMe = (req, res) => {
  const { name, phone } = req.body;

  db.query(
    "UPDATE users SET name = ?, phone = ? WHERE id = ?",
    [name, phone, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Lỗi cập nhật" });
      res.json({ success: true });
    },
  );
};
