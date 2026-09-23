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
  const { product_id, variant_name, price, stock, sku, color, size, image_url } = req.body;

  const final_variant_name = variant_name ? String(variant_name).trim() : (color || '') + (size ? ' - ' + size : '');

  if (!product_id || !price) {
    return res.status(400).json({ message: "Thiếu dữ liệu variant" });
  }

  db.query(
    "INSERT INTO product_variants (product_id, variant_name, price, stock, sku, color, size, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [product_id, final_variant_name, price, stock || 0, sku || null, color || null, size || null, image_url || null],
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
        let query = "UPDATE product_variants SET stock = ?";
        let params = [Number(v.stock) || 0];

        if (v.price !== undefined && v.price !== '') {
          query += ", price = ?";
          params.push(Number(v.price) || 0);
        }
        if (v.color !== undefined) {
          query += ", color = ?";
          params.push(v.color || null);
        }
        if (v.image_url !== undefined) {
          query += ", image_url = ?";
          params.push(v.image_url || null);
        }
        
        query += " WHERE id = ? AND product_id = ?";
        params.push(v.id, productId);

        db.query(
          query,
          params,
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
