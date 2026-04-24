const db = require("../config/db");

/* ===== GET ALL ===== */
exports.getAllCategories = (req, res) => {
  db.query("SELECT * FROM categories", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Get categories failed" });
    }

    // 🔥 QUAN TRỌNG: rows LÀ ARRAY
    res.json(rows);
  });
};

/* ===== CREATE ===== */
exports.createCategory = (req, res) => {
  const { name, display_type } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  db.query(
    "INSERT INTO categories (name, display_type) VALUES (?, ?)",
    [name, display_type || "general"],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Create category failed" });
      }

      // Ghi log
      db.query(
        "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
        [req.user.id, `Đã tạo danh mục mới: ${name}`, result.insertId]
      );

      res.json({
        id: result.insertId,
        name,
        display_type: display_type || "general",
      });
    }
  );
};

/* ===== UPDATE ===== */
exports.updateCategory = (req, res) => {
  const { name, display_type } = req.body;
  const { id } = req.params;

  // 1. Lấy tên cũ
  db.query("SELECT name FROM categories WHERE id = ?", [id], (errRows, rows) => {
    if (errRows || !rows.length) return res.status(404).json({ message: "Không tìm thấy danh mục" });
    const oldName = rows[0].name;

    // 2. Cập nhật
    db.query(
      "UPDATE categories SET name=?, display_type=? WHERE id=?",
      [name, display_type || "general", id],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Update category failed" });
        }

        // Ghi log chi tiết
        const logAction = `Đã cập nhật danh mục #${id} từ '${oldName}' sang '${name}'`;
        db.query(
          "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
          [req.user.id, logAction, id]
        );

        res.json({ message: "Category updated" });
      }
    );
  });
};

/* ===== DELETE ===== */
exports.deleteCategory = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM categories WHERE id=?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Delete category failed" });
    }

    // Ghi log
    db.query(
      "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
      [req.user.id, `Đã xóa danh mục #${id}`, id]
    );

    res.json({ message: "Category deleted" });
  });
};
