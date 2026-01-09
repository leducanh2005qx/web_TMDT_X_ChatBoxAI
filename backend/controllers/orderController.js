const db = require("../config/db");

/* =====================================================
   CREATE ORDER (USER) – TRỪ TỒN KHO
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
      return res.status(500).json({ message: "Lỗi transaction" });
    }

    const orderSql =
      "INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'pending')";

    db.query(orderSql, [userId, total], (err, result) => {
      if (err) {
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
              return db.rollback(() =>
                res.status(500).json({ message: "Lỗi chi tiết đơn hàng" })
              );
            }

            db.commit(() =>
              res.json({
                success: true,
                orderId,
                message: "Đặt hàng thành công",
              })
            );
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
                res.status(400).json({ message: "Sản phẩm không đủ tồn kho" })
              );
            }

            db.query(
              "UPDATE products SET stock = stock - ? WHERE id = ?",
              [item.quantity, item.id],
              (err) => {
                if (err) {
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
   USER: LẤY DANH SÁCH ĐƠN
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

/* =====================================================
   USER: CHI TIẾT ĐƠN
===================================================== */
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
   ADMIN: LẤY TẤT CẢ ĐƠN
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

/* =====================================================
   ADMIN: UPDATE STATUS – HOÀN KHO KHI HỦY
===================================================== */
exports.updateOrderStatus = (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  const allowed = ["pending", "confirmed", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: "Lỗi transaction" });

    db.query(
      "SELECT status FROM orders WHERE id = ? FOR UPDATE",
      [orderId],
      (err, rows) => {
        if (err || rows.length === 0) {
          return db.rollback(() =>
            res.status(404).json({ message: "Không tìm thấy đơn hàng" })
          );
        }

        const current = rows[0].status;

        // ❌ Không nhảy cóc
        if (current === "pending" && status === "completed") {
          return db.rollback(() =>
            res
              .status(400)
              .json({ message: "Phải xác nhận đơn trước khi hoàn thành" })
          );
        }

        // ❌ Không hủy đơn đã hoàn thành
        if (current === "completed" && status === "cancelled") {
          return db.rollback(() =>
            res.status(400).json({ message: "Không thể hủy đơn đã hoàn thành" })
          );
        }

        // 👉 HỦY → HOÀN KHO
        if (status === "cancelled" && current !== "cancelled") {
          db.query(
            "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
            [orderId],
            (err, items) => {
              if (err) {
                return db.rollback(() =>
                  res.status(500).json({ message: "Lỗi lấy chi tiết đơn" })
                );
              }

              const restore = (i) => {
                if (i === items.length) {
                  db.query(
                    "UPDATE orders SET status = ? WHERE id = ?",
                    [status, orderId],
                    () =>
                      db.commit(() =>
                        res.json({
                          success: true,
                          message: "Đã hủy đơn và hoàn kho",
                        })
                      )
                  );
                  return;
                }

                db.query(
                  "UPDATE products SET stock = stock + ? WHERE id = ?",
                  [items[i].quantity, items[i].product_id],
                  (err) => {
                    if (err) {
                      return db.rollback(() =>
                        res.status(500).json({ message: "Lỗi hoàn kho" })
                      );
                    }
                    restore(i + 1);
                  }
                );
              };

              restore(0);
            }
          );
        } else {
          db.query(
            "UPDATE orders SET status = ? WHERE id = ?",
            [status, orderId],
            () => db.commit(() => res.json({ success: true }))
          );
        }
      }
    );
  });
};

/* =====================================================
   ADMIN: STATISTICS (DOANH THU THỰC)
===================================================== */
exports.getStatistics = (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) AS totalOrders,
      IFNULL(SUM(total), 0) AS totalRevenue
    FROM orders
    WHERE status = 'completed'
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi thống kê" });
    }

    res.json({
      totalOrders: Number(rows[0].totalOrders),
      totalRevenue: Number(rows[0].totalRevenue),
    });
  });
};

/* =====================================================
   ADMIN: BEST SELLING PRODUCTS
===================================================== */
exports.getBestSellingProducts = (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.name,
      p.image,
      SUM(oi.quantity) AS totalSold
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.status = 'completed'
    GROUP BY p.id
    ORDER BY totalSold DESC
    LIMIT 5
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Lỗi thống kê sản phẩm bán chạy" });
    }
    res.json(rows);
  });
};

/* =====================================================
   ADMIN: UNCOMPLETED ORDERS
===================================================== */
exports.getUncompletedOrders = (req, res) => {
  const sql = `
    SELECT COUNT(*) AS totalUncompleted
    FROM orders
    WHERE status IN ('pending', 'confirmed')
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Lỗi thống kê đơn chưa hoàn thành" });
    }
    res.json({ totalUncompleted: Number(rows[0].totalUncompleted) });
  });
};
