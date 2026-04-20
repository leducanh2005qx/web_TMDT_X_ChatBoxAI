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

// ✅ Cập nhật stock hàng loạt cho nhiều variant + tự tính tổng vào products
exports.bulkUpdateVariantStock = (req, res) => {
  // body: { productId, updates: [{id, stock}, ...] }
  const { productId, updates } = req.body;

  if (!productId || !Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: "Thiếu dữ liệu cập nhật" });
  }

  // Cập nhật lần lượt từng variant
  const updatePromises = updates.map(
    (v) =>
      new Promise((resolve, reject) => {
        db.query(
          "UPDATE product_variants SET stock = ? WHERE id = ? AND product_id = ?",
          [Number(v.stock) || 0, v.id, productId],
          (err, result) => {
            if (err) return reject(err);
            if (result.affectedRows === 0) return reject(new Error(`Variant #${v.id} không tồn tại`));
            resolve();
          },
        );
      }),
  );

  Promise.all(updatePromises)
    .then(() => {
      // Tự tính tổng stock từ tất cả variant và ghi vào products
      db.query(
        `UPDATE products p
         SET p.stock = (SELECT IFNULL(SUM(pv.stock), 0) FROM product_variants pv WHERE pv.product_id = ?)
         WHERE p.id = ?`,
        [productId, productId],
        (err) => {
          if (err) return res.status(500).json({ message: "Lỗi cập nhật tổng stock: " + err.message });
          res.json({ success: true, message: "Đã cập nhật kho tất cả phân loại thành công" });
        },
      );
    })
    .catch((err) => res.status(500).json({ message: err.message }));
};
