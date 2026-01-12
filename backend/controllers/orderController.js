const db = require("../config/db");

/* =====================================================
   USER – CREATE ORDER (🔥 AUTO CHAT SYSTEM)
===================================================== */
exports.createOrder = (req, res) => {
  const userId = req.user?.id;
  const { items, total } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Giỏ hàng trống" });
  }

  const totalNumber = Number(total);
  if (!Number.isFinite(totalNumber) || totalNumber < 0) {
    return res.status(400).json({ message: "Tổng tiền không hợp lệ" });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error("BEGIN TRANSACTION ERR:", err);
      return res.status(500).json({ message: "Lỗi transaction" });
    }

    const orderSql =
      "INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'pending')";

    db.query(orderSql, [userId, totalNumber], (err, result) => {
      if (err) {
        console.error("INSERT ORDER ERR:", err);
        return db.rollback(() =>
          res.status(500).json({ message: "Lỗi tạo đơn hàng" })
        );
      }

      const orderId = result.insertId;

      const handleItem = (index) => {
        // ✅ Insert all order_items once
        if (index === items.length) {
          const values = items.map((item) => [
            orderId,
            item.id,
            item.quantity,
            item.price,
          ]);

          const sql =
            "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?";

          return db.query(sql, [values], (err) => {
            if (err) {
              console.error("INSERT ORDER_ITEMS ERR:", err);
              return db.rollback(() =>
                res.status(500).json({ message: "Lỗi chi tiết đơn hàng" })
              );
            }

            // ✅ COMMIT
            db.commit((commitErr) => {
              if (commitErr) {
                console.error("COMMIT ERR:", commitErr);
                return db.rollback(() =>
                  res.status(500).json({ message: "Lỗi commit đơn hàng" })
                );
              }

              /* ================= AUTO CHAT SYSTEM =================
                 - Không để lỗi chat làm fail order
                 - Ghi system message: sender_id = 0, receiver_id = userId
              ==================================================== */
              const systemMessage = `
🎉 Cảm ơn bạn đã đặt hàng!
🧾 Mã đơn: #${orderId}
💰 Tổng tiền: ${totalNumber.toLocaleString()} đ
📦 Trạng thái: Đang xử lý
              `.trim();

              db.query(
                `
                INSERT INTO chat_messages (sender_id, receiver_id, message, type)
                VALUES (?, ?, ?, 'system')
                `,
                [0, userId, systemMessage],
                (chatErr) => {
                  // ❗ chat lỗi thì log thôi, KHÔNG rollback order nữa
                  if (chatErr) {
                    console.error("AUTO CHAT INSERT ERR:", chatErr);
                  }

                  // ✅ Trả kết quả order
                  return res.json({ success: true, orderId });
                }
              );
            });
          });
        }

        // ✅ lock stock
        const item = items[index];

        if (
          !item?.id ||
          !Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0
        ) {
          return db.rollback(() =>
            res.status(400).json({ message: "Item không hợp lệ" })
          );
        }

        db.query(
          "SELECT stock FROM products WHERE id = ? FOR UPDATE",
          [item.id],
          (err, rows) => {
            if (err) {
              console.error("SELECT STOCK ERR:", err);
              return db.rollback(() =>
                res.status(500).json({ message: "Lỗi kiểm tra tồn kho" })
              );
            }

            if (!rows || rows.length === 0) {
              return db.rollback(() =>
                res.status(400).json({ message: "Sản phẩm không tồn tại" })
              );
            }

            if (Number(rows[0].stock) < Number(item.quantity)) {
              return db.rollback(() =>
                res.status(400).json({ message: "Không đủ tồn kho" })
              );
            }

            db.query(
              "UPDATE products SET stock = stock - ? WHERE id = ?",
              [item.quantity, item.id],
              (err) => {
                if (err) {
                  console.error("UPDATE STOCK ERR:", err);
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
   USER – ORDERS
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
      console.error("GET ORDERS BY USER ERR:", err);
      return res.status(500).json({ message: "Lỗi lấy đơn hàng" });
    }
    res.json(rows);
  });
};

exports.getOrderDetail = (req, res) => {
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

  db.query(sql, [req.params.id, req.user.id], (err, rows) => {
    if (err) {
      console.error("GET ORDER DETAIL ERR:", err);
      return res.status(500).json({ message: "Lỗi lấy chi tiết đơn hàng" });
    }

    if (!rows || rows.length === 0) {
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
        quantity: r.quantity,
        price: r.price,
      })),
    });
  });
};

/* =====================================================
   ADMIN – ORDERS
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
      console.error("ADMIN GET ALL ORDERS ERR:", err);
      return res.status(500).json({ message: "Lỗi admin orders" });
    }
    res.json(rows);
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
        console.error("ADMIN UPDATE STATUS ERR:", err);
        return res.status(500).json({ message: "Lỗi cập nhật trạng thái" });
      }

      if (!result || result.affectedRows === 0) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      res.json({ success: true });
    }
  );
};

/* =====================================================
   ADMIN – STATISTICS
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
      console.error("ADMIN STATS ERR:", err);
      return res.status(500).json({ message: "Lỗi thống kê" });
    }
    res.json(rows[0]);
  });
};

/* =====================================================
   ADMIN – BEST SELLING PRODUCTS
===================================================== */
exports.getBestSellingProducts = (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.name,
      p.image,
      SUM(oi.quantity) AS sold
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'completed'
    GROUP BY p.id
    ORDER BY sold DESC
    LIMIT 5
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("BEST SELLING ERR:", err);
      return res.status(500).json({ message: "Lỗi sản phẩm bán chạy" });
    }
    res.json(rows);
  });
};

/* =====================================================
   ADMIN – UNCOMPLETED ORDERS
===================================================== */
exports.getUncompletedOrders = (req, res) => {
  const sql = `
    SELECT 
      o.id AS orderId,
      o.total,
      o.status,
      o.created_at,
      u.email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.status IN ('pending', 'confirmed')
    ORDER BY o.created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("UNCOMPLETED ERR:", err);
      return res.status(500).json({ message: "Lỗi đơn chưa hoàn thành" });
    }
    res.json(rows);
  });
};
