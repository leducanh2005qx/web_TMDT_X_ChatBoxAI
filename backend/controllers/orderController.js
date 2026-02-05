const db = require("../config/db");
const Chat = require("../models/Chat");

/* =====================================================
    USER – CREATE ORDER (🔥 GIỮ NGUYÊN 100% LOGIC CŨ)
===================================================== */
exports.createOrder = (req, res) => {
  const userId = req.user?.id;
  const { items, total, shipping_address, voucher_id } = req.body;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: "Giỏ hàng trống" });

  const totalNumber = Number(total);
  if (!Number.isFinite(totalNumber) || totalNumber < 0)
    return res.status(400).json({ message: "Tổng tiền không hợp lệ" });

  if (!shipping_address || !String(shipping_address).trim())
    return res.status(400).json({ message: "Thiếu địa chỉ nhận hàng" });

  const expectedDate = new Date();
  expectedDate.setDate(expectedDate.getDate() + 3);
  const expected_delivery = expectedDate.toISOString().slice(0, 10);

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: "Lỗi transaction" });

    db.query(
      "SELECT name, phone FROM users WHERE id = ?",
      [userId],
      (err, urows) => {
        if (err || !urows || urows.length === 0) {
          return db.rollback(() =>
            res
              .status(500)
              .json({ message: "Không lấy được thông tin người dùng" }),
          );
        }

        const receiver_name = urows[0].name || "";
        const receiver_phone = urows[0].phone || "";

        db.query(
          `INSERT INTO orders 
            (user_id, total, status, receiver_name, receiver_phone, shipping_address, expected_delivery) 
           VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
          [
            userId,
            totalNumber,
            receiver_name,
            receiver_phone,
            shipping_address,
            expected_delivery,
          ],
          (err, result) => {
            if (err) {
              return db.rollback(() =>
                res.status(500).json({ message: "Lỗi tạo đơn hàng" }),
              );
            }

            const orderId = result.insertId;
            const values = items.map((i) => [
              orderId,
              i.variant_id,
              i.quantity,
              i.price,
            ]);

            db.query(
              "INSERT INTO order_items (order_id, variant_id, quantity, price) VALUES ?",
              [values],
              (err) => {
                if (err) {
                  return db.rollback(() =>
                    res.status(500).json({ message: "Lỗi chi tiết đơn hàng" }),
                  );
                }

                const stockUpdates = items.map(
                  (i) =>
                    new Promise((resolve, reject) => {
                      db.query(
                        "UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?",
                        [i.quantity, i.variant_id, i.quantity],
                        (err, result) => {
                          if (err || result.affectedRows === 0) return reject();
                          resolve();
                        },
                      );
                    }),
                );

                Promise.all(stockUpdates)
                  .then(() => {
                    const handleVoucher = (cb) => {
                      if (!voucher_id) return cb();

                      const sql = `
                        UPDATE user_vouchers uv
                        JOIN vouchers v ON uv.voucher_id = v.voucher_id
                        SET 
                          uv.used = 1,
                          v.used = v.used + 1
                        WHERE uv.user_id = ?
                          AND uv.voucher_id = ?
                          AND uv.used = 0
                          AND v.status = 'active'
                          AND v.quantity > v.used
                          AND (v.start_date IS NULL OR v.start_date <= CURDATE())
                          AND (v.end_date IS NULL OR v.end_date >= CURDATE())
                      `;

                      db.query(sql, [userId, voucher_id], (err, result) => {
                        if (err || result.affectedRows === 0) {
                          return db.rollback(() =>
                            res.status(400).json({
                              message:
                                "Voucher không hợp lệ hoặc đã được sử dụng",
                            }),
                          );
                        }
                        cb();
                      });
                    };

                    handleVoucher(() => {
                      db.commit((commitErr) => {
                        if (commitErr) {
                          return db.rollback(() =>
                            res
                              .status(500)
                              .json({ message: "Lỗi xác nhận đơn hàng" }),
                          );
                        }

                        // ✅ CHỈ THÊM LOGIC AUTO CHAT Ở ĐÂY (REAL-TIME)
                        Chat.getOrCreateThreadByUserId(
                          userId,
                          (err, thread) => {
                            if (!err && thread) {
                              const systemMessage = `
🎉 Cảm ơn bạn đã đặt hàng!
🧾 Mã đơn: #${orderId}
💰 Tổng thanh toán: ${totalNumber.toLocaleString()} đ
📍 Địa chỉ nhận: ${shipping_address}
🚚 Dự kiến giao: ${expected_delivery}
━━━━━━━━━━━━━━━━━━
Hệ thống Tiger Shop đã ghi nhận đơn hàng của bạn!`.trim();

                              Chat.createMessage(
                                {
                                  threadId: thread.id,
                                  senderRole: "SYSTEM",
                                  senderId: 0,
                                  receiverId: userId,
                                  message: systemMessage,
                                  orderId: orderId,
                                  type: "system",
                                },
                                (errM, newMessage) => {
                                  if (!errM && global.io) {
                                    global.io
                                      .to(String(thread.id))
                                      .emit("new_message", {
                                        id: newMessage.insertId || Date.now(),
                                        threadId: thread.id,
                                        sender_role: "SYSTEM",
                                        message: systemMessage,
                                        created_at: new Date(),
                                      });
                                  }
                                },
                              );
                            }
                          },
                        );

                        return res.json({
                          success: true,
                          orderId,
                          expected_delivery,
                        });
                      });
                    });
                  })
                  .catch(() => {
                    db.rollback(() =>
                      res
                        .status(400)
                        .json({ message: "Không đủ tồn kho cho biến thể" }),
                    );
                  });
              },
            );
          },
        );
      },
    );
  });
};

/* =====================================================
    USER – GET ORDERS
===================================================== */
exports.getOrdersByUser = (req, res) => {
  const sql = `
    SELECT 
      id AS orderId, total, status, created_at,
      receiver_name, receiver_phone, shipping_address, expected_delivery
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
      o.id AS orderId, o.total, o.status, o.created_at,
      o.receiver_name, o.receiver_phone, o.shipping_address, o.expected_delivery,
      p.name, p.image, pv.variant_name, oi.quantity, oi.price
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN product_variants pv ON oi.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
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
      receiver_name: rows[0].receiver_name,
      receiver_phone: rows[0].receiver_phone,
      shipping_address: rows[0].shipping_address,
      expected_delivery: rows[0].expected_delivery,
      items: rows.map((r) => ({
        name: r.name,
        variant_name: r.variant_name,
        image: r.image,
        quantity: r.quantity,
        price: r.price,
      })),
    });
  });
};

/* =====================================================
    ADMIN – ORDER MANAGEMENT
===================================================== */
exports.getAllOrdersAdmin = (req, res) => {
  const sql = `
    SELECT 
      o.id AS orderId, o.total, o.status, o.created_at,
      o.receiver_name, o.receiver_phone, o.shipping_address, o.expected_delivery, u.email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi admin orders" });
    res.json(rows);
  });
};

exports.getOrderDetailAdmin = (req, res) => {
  const sql = `
    SELECT 
      o.id AS orderId, o.total, o.status, o.created_at,
      o.receiver_name, o.receiver_phone, o.shipping_address, o.expected_delivery,
      u.email, p.name, p.image, pv.variant_name, oi.quantity, oi.price
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN product_variants pv ON oi.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
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
      receiver_name: rows[0].receiver_name,
      receiver_phone: rows[0].receiver_phone,
      shipping_address: rows[0].shipping_address,
      expected_delivery: rows[0].expected_delivery,
      items: rows.map((r) => ({
        name: r.name,
        variant_name: r.variant_name,
        image: r.image,
        quantity: r.quantity,
        price: r.price,
      })),
    });
  });
};

exports.updateOrderStatus = (req, res) => {
  const { status } = req.body;
  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Lỗi cập nhật" });
      res.json({ success: true });
    },
  );
};

/* =====================================================
    STATISTICS (GIỮ NGUYÊN)
===================================================== */
exports.getStatistics = (req, res) => {
  const sql = `
    SELECT COUNT(*) AS totalOrders, IFNULL(SUM(total), 0) AS totalRevenue
    FROM orders WHERE status = 'completed'
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi thống kê" });
    res.json(rows[0]);
  });
};

exports.getBestSellingProducts = (req, res) => {
  const sql = `
    SELECT p.id, p.name, p.image, SUM(oi.quantity) AS totalSold
    FROM order_items oi
    JOIN product_variants pv ON oi.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'completed'
    GROUP BY p.id ORDER BY totalSold DESC LIMIT 5
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi sản phẩm bán chạy" });
    res.json(rows);
  });
};

exports.getUncompletedOrders = (req, res) => {
  const sql = `
    SELECT COUNT(*) AS totalUncompleted
    FROM orders WHERE status IN ('pending', 'confirmed')
  `;
  db.query(sql, (err, rows) => {
    if (err)
      return res.status(500).json({ message: "Lỗi đơn chưa hoàn thành" });
    res.json(rows[0]);
  });
};
