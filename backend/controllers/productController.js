const Product = require("../models/Product");
const db = require("../config/db");

// ✅ LẤY TẤT CẢ SẢN PHẨM (Sửa lỗi tên bảng & GROUP BY)
exports.getAllProducts = (req, res) => {
  const sql = `
    SELECT 
      p.*, 
      IFNULL(c.name, 'Chưa phân loại') AS category_name,
      -- Đổi từ variants thành product_variants để khớp DB
      (SELECT IFNULL(SUM(v.stock), 0) FROM product_variants v WHERE v.product_id = p.id) AS total_variant_stock,
      (
        SELECT IFNULL(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', v.id,
              'variant_name', v.variant_name, 
              'stock', v.stock,
              'price', v.price
            )
          ), 
          JSON_ARRAY()
        )
        FROM product_variants v 
        WHERE v.product_id = p.id
      ) AS variants
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    GROUP BY p.id, c.name
    ORDER BY p.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("SQL Error:", err.message);
      return res
        .status(500)
        .json({ error: "Lỗi truy vấn database", details: err.message });
    }

    const productsWithVariants = result.map((p) => {
      let variantsData = [];
      try {
        if (p.variants) {
          variantsData =
            typeof p.variants === "string"
              ? JSON.parse(p.variants)
              : p.variants;
        }
      } catch (e) {
        variantsData = [];
      }

      return {
        ...p,
        stock: p.total_variant_stock > 0 ? p.total_variant_stock : p.stock,
        variants: Array.isArray(variantsData) ? variantsData : [],
        category: p.category_name,
        category_name: p.category_name,
      };
    });

    res.json(productsWithVariants);
  });
};

// ✅ LẤY CHI TIẾT SẢN PHẨM
exports.getProductById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      p.*, 
      IFNULL(c.name, 'Chưa phân loại') AS category_name,
      (SELECT IFNULL(SUM(v.stock), 0) FROM product_variants v WHERE v.product_id = p.id) AS total_variant_stock,
      (
        SELECT IFNULL(
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', v.id,
              'variant_name', v.variant_name, 
              'stock', v.stock, 
              'price', v.price
            )
          ), 
          JSON_ARRAY()
        )
        FROM product_variants v WHERE v.product_id = p.id
      ) AS variants
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.id = ?
    GROUP BY p.id, c.name
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0)
      return res.status(404).json({ message: "Không tìm thấy" });

    const p = result[0];
    let variantsData = [];
    try {
      if (p.variants) {
        variantsData =
          typeof p.variants === "string" ? JSON.parse(p.variants) : p.variants;
      }
    } catch (e) {
      variantsData = [];
    }

    res.json({
      ...p,
      stock: p.total_variant_stock > 0 ? p.total_variant_stock : p.stock,
      variants: Array.isArray(variantsData) ? variantsData : [],
      category: p.category_name,
      category_name: p.category_name,
    });
  });
};

// ✅ CREATE SẢN PHẨM
exports.createProduct = (req, res) => {
  const { name, price, description, stock, category_id } = req.body;
  const image = req.file ? `uploads/${req.file.filename}` : null;

  if (!name || !price)
    return res.status(400).json({ message: "Thiếu thông tin sản phẩm" });

  Product.create(
    {
      name,
      price: Number(price),
      description: description || "",
      stock: stock ? Number(stock) : 0,
      image,
      category_id: category_id ? Number(category_id) : null,
    },
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Thành công", id: result.insertId, image });
    },
  );
};

// ✅ UPDATE SẢN PHẨM
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price, description, stock, category_id } = req.body;
  const image = req.file ? `uploads/${req.file.filename}` : null;

  Product.update(
    id,
    {
      name,
      price: Number(price),
      description: description || "",
      stock: stock ? Number(stock) : 0,
      image,
      category_id: category_id ? Number(category_id) : null,
    },
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Cập nhật thành công", image });
    },
  );
};

// ✅ XÓA SẢN PHẨM
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  // Đổi sang product_variants
  db.query(`DELETE FROM product_variants WHERE product_id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: "Lỗi xóa biến thể" });
    Product.delete(id, (err) => {
      if (err)
        return res.status(500).json({ error: "Sản phẩm vướng đơn hàng" });
      res.json({ message: "Xóa thành công" });
    });
  });
};

exports.getProductReviews = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT r.id, r.rating, r.comment, r.image_url, r.created_at, u.name AS user_name
    FROM product_reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ?
    ORDER BY r.id DESC
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Không thể lấy đánh giá sản phẩm" });
    return res.json(rows);
  });
};

exports.createOrUpdateProductReview = (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const imageUrl = req.file ? `uploads/${req.file.filename}` : null;
  const score = Number(rating);
  if (!score || score < 1 || score > 5) {
    return res.status(400).json({ message: "Rating phải từ 1 đến 5" });
  }

  db.query(
    "SELECT role_id, status FROM users WHERE id = ?",
    [req.user.id],
    (roleErr, rows) => {
      if (roleErr) return res.status(500).json({ message: "Lỗi kiểm tra người dùng" });
      if (!rows.length) return res.status(401).json({ message: "Người dùng không hợp lệ" });
      const roleId = Number(rows[0].role_id);
      if (![4, 5].includes(roleId)) {
        return res.status(403).json({ message: "Chỉ khách hàng mới được đánh giá sản phẩm" });
      }
      if (rows[0].status !== "active") {
        return res.status(403).json({ message: "Tài khoản chưa active" });
      }

      const verifySql = `
        SELECT 1
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN product_variants pv ON pv.id = oi.variant_id
        WHERE o.user_id = ?
          AND pv.product_id = ?
          AND (
            o.payment_method = 'qr'
            OR o.status = 'completed'
          )
        LIMIT 1
      `;
      db.query(verifySql, [req.user.id, id], (verifyErr, verifyRows) => {
        if (verifyErr) {
          return res.status(500).json({ message: "Không thể kiểm tra lịch sử mua hàng" });
        }
        if (!verifyRows.length) {
          return res.status(403).json({
            message:
              "Đánh giá chỉ khả dụng khi đơn đã hoàn tất hoặc thanh toán chuyển khoản QR",
          });
        }

        const sql = `
          INSERT INTO product_reviews (product_id, user_id, rating, comment, image_url)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            rating = VALUES(rating),
            comment = VALUES(comment),
            image_url = COALESCE(VALUES(image_url), image_url),
            updated_at = CURRENT_TIMESTAMP
        `;
        db.query(
          sql,
          [id, req.user.id, score, comment || null, imageUrl],
          (err) => {
            if (err) return res.status(500).json({ message: "Không thể gửi đánh giá" });
            return res.json({ message: "Đã lưu đánh giá sản phẩm" });
          },
        );
      });
    },
  );
};
