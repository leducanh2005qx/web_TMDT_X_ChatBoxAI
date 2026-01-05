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

    const orderSql =
      "INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'pending')";

    db.query(orderSql, [userId, total], (err, result) => {
      if (err) {
        console.error(err);
        return db.rollback(() =>
          res.status(500).json({ message: "Lỗi tạo đơn hàng" })
        );
      }

      const orderId = result.insertId;

      const handleItem = (index) => {
        if (index === items.length) {
          const orderItems = items.map((item) => [
            orderId,
            item.id,
            item.quantity,
            item.price,
          ]);

          const itemSql =
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?";

          db.query(itemSql, [orderItems], (err) => {
            if (err) {
              console.error(err);
              return db.rollback(() =>
                res.status(500).json({ message: "Lỗi chi tiết đơn hàng" })
              );
            }

            db.commit((commitErr) => {
              if (commitErr) {
                console.error(commitErr);
                return db.rollback(() =>
                  res.status(500).json({ message: "Lỗi xác nhận đơn hàng" })
                );
              }

              res.json({ success: true, orderId });
            });
          });
          return;
        }

        const item = items[index];

        db.query(
          "SELECT stock FROM products WHERE id = ? FOR UPDATE",
          [item.id],
          (err, rows) => {
            if (err || rows.length === 0) {
              return db.rollback(() =>
                res.status(400).json({ message: "Sản phẩm không tồn tại" })
              );
            }

            if (rows[0].stock < item.quantity) {
              return db.rollback(() =>
                res.status(400).json({ message: "Không đủ tồn kho" })
              );
            }

            db.query(
              "UPDATE products SET stock = stock - ? WHERE id = ?",
              [item.quantity, item.id],
              (errUpdate) => {
                if (errUpdate) {
                  console.error(errUpdate);
                  return db.rollback(() =>
                    res.status(500).json({ message: "Lỗi cập nhật tồn kho" })
                  );
                }

                handleItem(index + 1);
              }
            );
          }
        );
      };

      handleItem(0);
    });
  });
};

/* =====================================================
   USER: ORDERS
===================================================== */
exports.getOrdersByUser = (req, res) => {
  const sql = `
    SELECT id AS orderId, total, status, created_at
    FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [req.user.id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi lấy đơn hàng" });
    }
    res.json(rows);
  });
};

exports.getOrderDetail = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      o.id AS orderId,
      o.total,
      o.status,
      o.created_at,
      p.name,
      p.image,
      oi.quantity,
      oi.price
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.id = ? AND o.user_id = ?
  `;

  db.query(sql, [id, req.user.id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi lấy chi tiết đơn hàng" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.json({
      orderId: rows[0].orderId,
      total: rows[0].total,
      status: rows[0].status,
      created_at: rows[0].created_at,
      items: rows.map((r) => ({
        name: r.name,
        image: r.image,
        quantity: Number(r.quantity),
        price: Number(r.price),
      })),
    });
  });
};

/* =====================================================
   ADMIN
===================================================== */
exports.getAllOrdersAdmin = (req, res) => {
  const sql = `
    SELECT 
      o.id AS orderId,
      o.total,
      o.status,
      o.created_at,
      u.email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi admin orders" });
    }
    res.json(rows);
  });
};

exports.getOrderDetailAdmin = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      o.id AS orderId,
      o.total,
      o.status,
      o.created_at,
      u.email,
      p.name,
      p.image,
      oi.quantity,
      oi.price
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.id = ?
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi lấy chi tiết admin" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    res.json({
      orderId: rows[0].orderId,
      total: rows[0].total,
      status: rows[0].status,
      created_at: rows[0].created_at,
      email: rows[0].email,
      items: rows.map((r) => ({
        name: r.name,
        image: r.image,
        quantity: Number(r.quantity),
        price: Number(r.price),
      })),
    });
  });
};

exports.updateOrderStatus = (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "confirmed", "completed", "cancelled"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }

  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Lỗi cập nhật trạng thái" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      res.json({ success: true });
    }
  );
};

exports.getStatistics = (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) AS totalOrders,
      IFNULL(SUM(total), 0) AS totalRevenue
    FROM orders
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi thống kê" });
    }
    res.json(rows[0]);
  });
};
