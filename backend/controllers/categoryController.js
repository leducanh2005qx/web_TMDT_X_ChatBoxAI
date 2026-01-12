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
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  db.query(
    "INSERT INTO categories (name) VALUES (?)",
    [name],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Create category failed" });
      }

      res.json({
        id: result.insertId,
        name,
      });
    }
  );
};

/* ===== UPDATE ===== */
exports.updateCategory = (req, res) => {
  const { name } = req.body;
  const { id } = req.params;

  db.query(
    "UPDATE categories SET name=? WHERE id=?",
    [name, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Update category failed" });
      }

      res.json({ message: "Category updated" });
    }
  );
};

/* ===== DELETE ===== */
exports.deleteCategory = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM categories WHERE id=?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Delete category failed" });
    }

    res.json({ message: "Category deleted" });
  });
};
