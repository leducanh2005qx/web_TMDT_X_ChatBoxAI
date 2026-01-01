const db = require("../config/db");

/* =====================================================
   CREATE ORDER + TRỪ KHO (TRANSACTION)
===================================================== */
exports.createOrder = (req, res) => {
  const userId = req.user.id;
  const { items, total } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Giỏ hàng trống" });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }

    // 1️⃣ Tạo đơn hàng
    const orderSql = "INSERT INTO orders (user_id, total) VALUES (?, ?)";
    db.query(orderSql, [userId, total], (err, result) => {
      if (err) {
        return db.rollback(() => {
          console.error(err);
          res.status(500).json({ message: "Lỗi tạo đơn hàng" });
        });
      }

      const orderId = result.insertId;

      // 2️⃣ Kiểm tra & trừ tồn kho
      const handleItem = (index) => {
        if (index === items.length) {
          const orderItems = items.map((item) => [
            orderId,
            item.id,
            item.quantity,
            item.price,
          ]);

          const itemSql = `
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES ?
          `;

          db.query(itemSql, [orderItems], (err2) => {
            if (err2) {
              return db.rollback(() => {
                console.error(err2);
                res.status(500).json({ message: "Lỗi thêm chi tiết đơn hàng" });
              });
            }

            db.commit((errCommit) => {
              if (errCommit) {
                return db.rollback(() => {
                  console.error(errCommit);
                  res.status(500).json({ message: "Lỗi xác nhận đơn hàng" });
                });
              }

              res.json({ success: true, orderId });
            });
          });
          return;
        }

        const item = items[index];

        const stockSql = "SELECT stock FROM products WHERE id = ? FOR UPDATE";
        db.query(stockSql, [item.id], (errStock, stockResult) => {
          if (errStock || stockResult.length === 0) {
            return db.rollback(() =>
              res.status(400).json({ message: "Sản phẩm không tồn tại" })
            );
          }

          if (stockResult[0].stock < item.quantity) {
            return db.rollback(() =>
              res.status(400).json({
                message: `Sản phẩm ID ${item.id} không đủ tồn kho`,
              })
            );
          }

          const updateSql =
            "UPDATE products SET stock = stock - ? WHERE id = ?";
          db.query(updateSql, [item.quantity, item.id], (errUpdate) => {
            if (errUpdate) {
              return db.rollback(() => {
                console.error(errUpdate);
                res.status(500).json({ message: "Lỗi cập nhật tồn kho" });
              });
            }

            handleItem(index + 1);
          });
        });
      };

      handleItem(0);
    });
  });
};

/* =====================================================
   GET ORDERS BY USER
===================================================== */
exports.getOrdersByUser = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT id, total, created_at
    FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi lấy đơn hàng" });
    }
    res.json(result);
  });
};

/* =====================================================
   GET ORDER DETAIL (🔥 FIX CHUẨN)
===================================================== */
exports.getOrderDetail = (req, res) => {
  const userId = req.user.id;
  const orderId = req.params.id;

  const sql = `
    SELECT 
      o.id AS orderId,
      o.total AS orderTotal,
      o.created_at AS orderCreatedAt,
      p.name,
      p.image,
      oi.quantity,
      oi.price
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.id = ? AND o.user_id = ?
  `;

  db.query(sql, [orderId, userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi lấy chi tiết đơn hàng" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.json({
      orderId: rows[0].orderId,
      total: Number(rows[0].orderTotal),
      created_at: rows[0].orderCreatedAt,
      items: rows.map((row) => ({
        name: row.name,
        image: row.image,
        quantity: Number(row.quantity),
        price: Number(row.price),
      })),
    });
  });
};

/* =====================================================
   ADMIN: GET ALL ORDERS
===================================================== */
exports.getAllOrders = (req, res) => {
  const sql = `
    SELECT 
      o.id,
      o.total,
      o.created_at,
      u.email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi lấy tất cả đơn hàng" });
    }

    res.json(result);
  });
};

/* =====================================================
   ADMIN: ORDER STATISTICS
===================================================== */
exports.getOrderStats = (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) AS totalOrders,
      IFNULL(SUM(total), 0) AS totalRevenue
    FROM orders
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi thống kê đơn hàng" });
    }

    res.json(result[0]);
  });
};
