const db = require("../config/db");

const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Không có quyền truy cập" });
  }

  db.query("SELECT role_id FROM users WHERE id = ?", [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi kiểm tra quyền" });
    if (!rows.length || rows[0].role_id !== 1) {
      return res.status(403).json({ message: "Forbidden: Chỉ Admin mới có quyền thực hiện hành động này!" });
    }
    next();
  });
};

module.exports = isAdmin;
