const Product = require("../models/Product");
const db = require("../config/db");

// ✅ LẤY TẤT CẢ SẢN PHẨM
exports.getAllProducts = (req, res) => {
  const showDeleted = req.query.deleted === "true";
  
  // Kiểm tra quyền: Nếu không có token hoặc không phải Admin/Manager thì chỉ lấy 'active'
  const userRole = req.user ? String(req.user.role || "").toUpperCase() : null;
  const canSeeAll = ["ADMIN", "MANAGER"].includes(userRole);

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
        FROM product_variants v 
        WHERE v.product_id = p.id
      ) AS variants
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${showDeleted ? "p.deleted_at IS NOT NULL" : "p.deleted_at IS NULL"}
    ${canSeeAll ? "" : " AND p.status = 'active'"}
    GROUP BY p.id, c.name
    ORDER BY p.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("SQL Error:", err.message);
      return res.status(500).json({ error: "Lỗi truy vấn database", details: err.message });
    }

    const productsWithVariants = result.map((p) => {
      let variantsData = [];
      try {
        if (p.variants) {
          variantsData = typeof p.variants === "string" ? JSON.parse(p.variants) : p.variants;
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
    WHERE p.id = ? AND p.deleted_at IS NULL
    GROUP BY p.id, c.name
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ message: "Không tìm thấy" });

    const p = result[0];
    let variantsData = [];
    try {
      if (p.variants) {
        variantsData = typeof p.variants === "string" ? JSON.parse(p.variants) : p.variants;
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

// ✅ CREATE SẢN PHẨM (Mới)
exports.createProduct = (req, res) => {
  const { name, price, description, stock, category_id, display_type, specifications } = req.body;
  const image = req.file ? `uploads/${req.file.filename}` : null;

  if (!name || !price) return res.status(400).json({ message: "Thiếu thông tin sản phẩm" });

  const userRole = String(req.user.role || "").toUpperCase();
  const status = userRole === "ADMIN" ? "active" : "pending";

  Product.create(
    {
      name,
      price: Number(price),
      description: description || "",
      stock: stock ? Number(stock) : 0,
      image,
      category_id: category_id ? Number(category_id) : null,
      status,
      manager_id: req.user.id,
      display_type: display_type || 'general',
      specifications: specifications || '{}'
    },
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Thành công", id: result.insertId, image, status });
    },
  );
};

// ✅ UPDATE SẢN PHẨM
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price, description, stock, category_id, display_type, specifications } = req.body;
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
      display_type,
      specifications
    },
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Cập nhật thành công", image });
    },
  );
};

// ✅ XÓA SẢN PHẨM (SOFT DELETE)
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  db.query(`UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: "Lỗi xóa sản phẩm" });
    res.json({ message: "Xóa thành công vào thùng rác" });
  });
};

exports.restoreProduct = (req, res) => {
  const { id } = req.params;
  db.query(`UPDATE products SET deleted_at = NULL WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: "Lỗi khôi phục sản phẩm" });
    res.json({ message: "Khôi phục sản phẩm thành công" });
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
  if (!score || score < 1 || score > 5) return res.status(400).json({ message: "Rating phải từ 1 đến 5" });

  db.query("SELECT role_id, status FROM users WHERE id = ?", [req.user.id], (roleErr, rows) => {
    if (roleErr || !rows.length) return res.status(401).json({ message: "Người dùng không hợp lệ" });
    const roleId = Number(rows[0].role_id);
    if (![4, 5].includes(roleId)) return res.status(403).json({ message: "Chỉ khách hàng mới được đánh giá sản phẩm" });
    if (rows[0].status !== "active") return res.status(403).json({ message: "Tài khoản chưa active" });

    const verifySql = `
      SELECT 1 FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN product_variants pv ON pv.id = oi.variant_id
      WHERE o.user_id = ? AND pv.product_id = ? AND (o.payment_method = 'qr' OR o.status = 'completed')
      LIMIT 1
    `;
    db.query(verifySql, [req.user.id, id], (verifyErr, verifyRows) => {
      if (verifyErr || !verifyRows.length) return res.status(403).json({ message: "Đánh giá chỉ khả dụng khi đơn đã hoàn tất" });

      const sql = `
        INSERT INTO product_reviews (product_id, user_id, rating, comment, image_url)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), image_url = COALESCE(VALUES(image_url), image_url), updated_at = CURRENT_TIMESTAMP
      `;
      db.query(sql, [id, req.user.id, score, comment || null, imageUrl], (err) => {
        if (err) return res.status(500).json({ message: "Không thể gửi đánh giá" });
        return res.json({ message: "Đã lưu đánh giá sản phẩm" });
      });
    });
  });
};

exports.getInventoryAlert = (req, res) => {
  const sql = "SELECT id, name, stock, image FROM products WHERE stock < 5 AND deleted_at IS NULL ORDER BY stock ASC";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi kiểm tra kho" });
    db.query("SELECT COUNT(*) as trashCount FROM products WHERE deleted_at IS NOT NULL", (err2, trashRows) => {
      res.json({ alerts: rows, trashCount: trashRows?.[0]?.trashCount || 0 });
    });
  });
};

/* ===== ADMIN APPROVALS ===== */

exports.getPendingProducts = (req, res) => {
  Product.getPending((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.decideProduct = (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  if (!["active", "hidden"].includes(status)) return res.status(400).json({ message: "Trạng thái không hợp lệ" });

  // 1. Lấy thông tin để ghi log
  const getInfoSql = `
    SELECT p.name AS product_name, u.name AS admin_name 
    FROM products p, users u 
    WHERE p.id = ? AND u.id = ?
  `;

  db.query(getInfoSql, [id, req.user.id], (infoErr, infoRows) => {
    if (infoErr || !infoRows.length) return res.status(500).json({ message: "Lỗi truy vấn thông tin log" });

    const { product_name, admin_name } = infoRows[0];
    const actionVerb = status === 'active' ? 'Duyệt' : 'Từ chối';
    const logAction = `Admin ${admin_name} đã ${actionVerb} sản phẩm ${product_name}`;

    // 2. Cập nhật trạng thái sản phẩm
    Product.updateStatus(id, status, reason, (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // 3. Ghi log vào bảng user_activity_logs
      const logSql = "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)";
      db.query(logSql, [req.user.id, logAction, id], (logInsertErr) => {
         if (logInsertErr) console.error("Lỗi ghi log:", logInsertErr.message);
         res.json({ message: `Sản phẩm đã được ${status === 'active' ? 'duyệt' : 'từ chối'}` });
      });
    });
  });
};

// ✅ LẤY DẢNH SÁCH ĐÃ QUYẾT ĐỊNH (active + hidden) cho Admin lịch sử
exports.getDecidedProducts = (req, res) => {
  // Chỉ Admin (role_id = 1)
  const userRole = req.user ? String(req.user.role || "").toUpperCase() : null;
  if (userRole !== "ADMIN") {
    return res.status(403).json({ message: "Chỉ Admin mới xem được lịch sử duyệt" });
  }
  Product.getDecided((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// ✅ KHÔI PHỤC SẢN PHẨM BỊ TỪ CHỐI về pending
exports.restoreProductToPending = (req, res) => {
  const { id } = req.params;
  const userRole = req.user ? String(req.user.role || "").toUpperCase() : null;
  if (userRole !== "ADMIN") {
    return res.status(403).json({ message: "Chỉ Admin mới khôi phục sản phẩm" });
  }

  // Chỉ cho phép khôi phục sản phẩm 'hidden' (bị từ chối)
  db.query(
    "SELECT id, status, name FROM products WHERE id = ? AND deleted_at IS NULL",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi truy vấn" });
      if (!rows.length) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      if (rows[0].status !== "hidden") {
        return res.status(400).json({ message: "Chỉ có thể khôi phục sản phẩm bị từ chối (hidden)" });
      }

      db.query(
        "UPDATE products SET status = 'pending', rejection_reason = NULL WHERE id = ?",
        [id],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ message: "Không thể khôi phục sản phẩm" });

          // Ghi log
          const logSql = "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)";
          const logMsg = `Admin đã khôi phục sản phẩm '${rows[0].name}' về chờ duyệt`;
          db.query(logSql, [req.user.id, logMsg, id], (logErr) => {
            if (logErr) console.error("Lỗi ghi log:", logErr.message);
          });

          return res.json({ message: `Đã khôi phục sản phẩm '${rows[0].name}' về hàng chờ duyệt` });
        }
      );
    }
  );
};
