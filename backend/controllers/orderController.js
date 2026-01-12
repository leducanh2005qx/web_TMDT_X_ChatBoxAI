const db = require("../config/db");
const Chat = require("../models/Chat");

/* =====================================================
   USER – CREATE ORDER (🔥 AUTO CHAT + AUTO THREAD)
===================================================== */
exports.createOrder = (req, res) => {
  const userId = req.user?.id;
  const { items, total } = req.body;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: "Giỏ hàng trống" });

  const totalNumber = Number(total);
  if (!Number.isFinite(totalNumber) || totalNumber < 0)
    return res.status(400).json({ message: "Tổng tiền không hợp lệ" });

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: "Lỗi transaction" });

    db.query(
      "INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'pending')",
      [userId, totalNumber],
      (err, result) => {
        if (err) {
          return db.rollback(() =>
            res.status(500).json({ message: "Lỗi tạo đơn hàng" })
          );
        }

        const orderId = result.insertId;
        const values = items.map((i) => [orderId, i.id, i.quantity, i.price]);

        db.query(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
          [values],
          (err) => {
            if (err) {
              return db.rollback(() =>
                res.status(500).json({ message: "Lỗi chi tiết đơn hàng" })
              );
            }

            db.commit(() => {
              // AUTO CHAT (không làm fail order)
              Chat.getOrCreateThreadByUserId(userId, (err, thread) => {
                if (!err && thread) {
                  const systemMessage = `
🎉 Cảm ơn bạn đã đặt hàng!
🧾 Mã đơn: #${orderId}
💰 Tổng tiền: ${totalNumber.toLocaleString()} đ
📦 Trạng thái: Đang xử lý
                  `.trim();

                  Chat.createMessage(
                    {
                      threadId: thread.id,
                      senderRole: "SYSTEM",
                      senderId: 0,
                      receiverId: userId,
                      message: systemMessage,
                      orderId,
                      type: "system",
                    },
                    () => {}
                  );
                }
              });

              return res.json({ success: true, orderId });
            });
          }
        );
      }
    );
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
    if (err) return res.status(500).json({ message: "Lỗi lấy đơn hàng" });
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
    if (err) return res.status(500).json({ message: "Lỗi chi tiết đơn hàng" });
    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

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
   ADMIN – ORDERS LIST
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
    if (err) return res.status(500).json({ message: "Lỗi admin orders" });
    res.json(rows);
  });
};

/* =====================================================
   ✅ ADMIN – ORDER DETAIL (FIX LỖI “KHÔNG TÌM THẤY ĐƠN HÀNG”)
===================================================== */
exports.getOrderDetailAdmin = (req, res) => {
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

  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi chi tiết đơn hàng" });
    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    res.json({
      orderId: rows[0].orderId,
      email: rows[0].email,
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
   ADMIN – UPDATE STATUS
===================================================== */
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
      if (err) return res.status(500).json({ message: "Lỗi cập nhật" });
      if (!result.affectedRows)
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      return res.json({ success: true });
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
    if (err) return res.status(500).json({ message: "Lỗi thống kê" });
    res.json(rows[0]);
  });
};

/* =====================================================
   ADMIN – BEST SELLING
===================================================== */
exports.getBestSellingProducts = (req, res) => {
  const sql = `
    SELECT 
      p.id,
      p.name,
      p.image,
      SUM(oi.quantity) AS totalSold
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'completed'
    GROUP BY p.id
    ORDER BY totalSold DESC
    LIMIT 5
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi sản phẩm bán chạy" });
    res.json(rows);
  });
};

/* =====================================================
   ADMIN – UNCOMPLETED
===================================================== */
exports.getUncompletedOrders = (req, res) => {
  const sql = `
    SELECT COUNT(*) AS totalUncompleted
    FROM orders
    WHERE status IN ('pending', 'confirmed')
  `;

  db.query(sql, (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Lỗi đơn chưa hoàn thành" });
    res.json(rows[0]);
  });
};
