const db = require("../config/db");

// GET ALL CATEGORIES
exports.getAllCategories = (req, res) => {
  db.query("SELECT id, name FROM categories ORDER BY id ASC", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi lấy danh mục" });
    }
    res.json(rows);
  });
};
