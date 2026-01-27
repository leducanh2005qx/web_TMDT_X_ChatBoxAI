const db = require("../config/db");

// Lấy variant theo product
exports.getVariantsByProduct = (req, res) => {
  const { productId } = req.params;

  db.query(
    "SELECT * FROM product_variants WHERE product_id = ?",
    [productId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    },
  );
};

// Thêm variant
exports.createVariant = (req, res) => {
  const { product_id, variant_name, price, stock } = req.body;

  if (!product_id || !variant_name || !price) {
    return res.status(400).json({ message: "Thiếu dữ liệu variant" });
  }

  db.query(
    "INSERT INTO product_variants (product_id, variant_name, price, stock) VALUES (?, ?, ?, ?)",
    [product_id, variant_name, price, stock || 0],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Thêm variant thành công" });
    },
  );
};

// Xóa variant
exports.deleteVariant = (req, res) => {
  db.query(
    "DELETE FROM product_variants WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Xóa variant thành công" });
    },
  );
};
