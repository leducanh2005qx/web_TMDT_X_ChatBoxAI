const db = require("../config/db");
const Chat = require("../models/Chat");

/* =====================================================
    USER – CREATE ORDER (HỖ TRỢ VOUCHER + PAYMENT METHOD)
===================================================== */
exports.createOrder = (req, res) => {
  const userId = req.user?.id;
  // Nhận payment_method từ Frontend
  const { items, total, shipping_address, voucher_ids, payment_method } =
    req.body;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: "Giỏ hàng trống" });

  const totalNumber = Number(total);
  if (!Number.isFinite(totalNumber) || totalNumber < 0)
    return res.status(400).json({ message: "Tổng tiền không hợp lệ" });

  if (!shipping_address || !String(shipping_address).trim())
    return res.status(400).json({ message: "Thiếu địa chỉ nhận hàng" });

  // ✅ Dự kiến nhận: +3 ngày
  const expectedDate = new Date();
  expectedDate.setDate(expectedDate.getDate() + 3);
  const expected_delivery = expectedDate.toISOString().slice(0, 10);

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ message: "Lỗi transaction" });

    // ✅ LẤY TÊN + SĐT từ USERS
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

        // ✅ INSERT ORDERS (Đã thêm payment_method)
        db.query(
          `INSERT INTO orders 
            (user_id, total, status, receiver_name, receiver_phone, shipping_address, expected_delivery, payment_method) 
           VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`,
          [
            userId,
            totalNumber,
            receiver_name,
            receiver_phone,
            shipping_address,
            expected_delivery,
            payment_method || "cod", // Mặc định là cod nếu frontend không gửi
          ],
          (err, result) => {
            if (err) {
              return db.rollback(() =>
                res
                  .status(500)
                  .json({ message: "Lỗi tạo đơn hàng: " + err.message }),
              );
            }

            const orderId = result.insertId;

            // ✅ INSERT ORDER_ITEMS
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

                // ✅ TRỪ KHO VARIANT
                const stockUpdates = items.map(
                  (i) =>
                    new Promise((resolve, reject) => {
                      db.query(
                        "UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?",
                        [i.quantity, i.variant_id, i.quantity],
                        (err, resultStock) => {
                          if (err) return reject(err);
                          if (resultStock.affectedRows === 0)
                            return reject(
                              new Error("Hết hàng hoặc ID variant sai"),
                            );
                          resolve();
                        },
                      );
                    }),
                );

                Promise.all(stockUpdates)
                  .then(() => {
                    // ✅ VOUCHER LOGIC (HỖ TRỢ NHIỀU MÃ)
                    const handleVoucher = (cb) => {
                      if (
                        !voucher_ids ||
                        !Array.isArray(voucher_ids) ||
                        voucher_ids.length === 0
                      ) {
                        return cb();
                      }

                      const sql = `
                        UPDATE user_vouchers uv
                        JOIN vouchers v ON uv.voucher_id = v.voucher_id
                        SET 
                          uv.used = 1,
                          v.used = v.used + 1,
                          v.status = CASE WHEN (v.used + 1) >= v.quantity THEN 'inactive' ELSE v.status END
                        WHERE uv.user_id = ?
                          AND uv.voucher_id IN (?)
                          AND uv.used = 0
                          AND v.status = 'active'
                          AND v.quantity > v.used
                      `;

                      db.query(sql, [userId, voucher_ids], (err, resultV) => {
                        if (err || resultV.affectedRows < voucher_ids.length) {
                          return db.rollback(() =>
                            res
                              .status(400)
                              .json({ message: "Voucher không khả dụng" }),
                          );
                        }
                        cb();
                      });
                    };

                    handleVoucher(() => {
                      db.commit((commitErr) => {
                        if (commitErr) {
                          return db.rollback(() =>
                            res.status(500).json({ message: "Lỗi commit" }),
                          );
                        }

                        // ✅ LOGIC AUTO CHAT REAL-TIME (Thông báo đơn hàng)
                        Chat.getOrCreateThreadByUserId(
                          userId,
                          (errT, thread) => {
                            if (!errT && thread) {
                              const systemMessage = `🎉 Đơn hàng #${orderId} thành công!\n💰 Tổng: ${totalNumber.toLocaleString()} đ\n💳 PTTT: ${payment_method === "qr" ? "Chuyển khoản QR" : "Tiền mặt"}\n🚚 Tiger Shop đang chuẩn bị hàng cho bạn!`;

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
                  .catch((err) => {
                    db.rollback(() =>
                      res.status(400).json({ message: err.message }),
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
    USER – GET ORDERS & DETAIL (CẬP NHẬT TRƯỜNG THANH TOÁN)
===================================================== */
exports.getOrdersByUser = (req, res) => {
  const sql = `
    SELECT id AS orderId, total, status, created_at, receiver_name, receiver_phone, 
           shipping_address, expected_delivery, payment_method
    FROM orders WHERE user_id = ? ORDER BY created_at DESC
  `;
  db.query(sql, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi lấy đơn hàng" });
    res.json(rows);
  });
};

exports.getOrderDetail = (req, res) => {
  const sql = `
    SELECT o.id AS orderId, o.total, o.status, o.created_at, o.receiver_name, o.receiver_phone, 
           o.shipping_address, o.expected_delivery, o.payment_method,
           p.name, p.image, pv.variant_name, oi.quantity, oi.price
    FROM orders o 
    JOIN order_items oi ON o.id = oi.order_id 
    JOIN product_variants pv ON oi.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id 
    WHERE o.id = ? AND o.user_id = ?
  `;
  db.query(sql, [req.params.id, req.user.id], (err, rows) => {
    if (err || !rows?.length)
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
      payment_method: rows[0].payment_method,
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
    ADMIN – MANAGEMENT (CẬP NHẬT TRƯỜNG THANH TOÁN)
===================================================== */
exports.getAllOrdersAdmin = (req, res) => {
  const sql = `
    SELECT o.id AS orderId, o.total, o.status, o.created_at, o.receiver_name, o.receiver_phone, 
           o.shipping_address, o.expected_delivery, o.payment_method, u.email 
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
    SELECT o.id AS orderId, o.total, o.status, o.created_at, o.receiver_name, o.receiver_phone, 
           o.shipping_address, o.expected_delivery, o.payment_method, u.email, 
           p.name, p.image, pv.variant_name, oi.quantity, oi.price
    FROM orders o 
    LEFT JOIN users u ON o.user_id = u.id 
    JOIN order_items oi ON o.id = oi.order_id 
    JOIN product_variants pv ON oi.variant_id = pv.id 
    JOIN products p ON pv.product_id = p.id
    WHERE o.id = ?
  `;
  db.query(sql, [req.params.id], (err, rows) => {
    if (err || !rows?.length)
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
      payment_method: rows[0].payment_method,
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
  db.query(
    "UPDATE orders SET status = ? WHERE id = ?",
    [req.body.status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Lỗi cập nhật" });
      res.json({ success: true });
    },
  );
};

/* =====================================================
    STATISTICS (GIỮ NGUYÊN)
===================================================== */
exports.getStatistics = (req, res) => {
  db.query(
    "SELECT COUNT(*) AS totalOrders, IFNULL(SUM(total), 0) AS totalRevenue FROM orders WHERE status = 'completed'",
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi thống kê" });
      res.json(rows[0]);
    },
  );
};

exports.getBestSellingProducts = (req, res) => {
  const sql = `
    SELECT p.id, p.name, p.image, SUM(oi.quantity) AS totalSold 
    FROM order_items oi 
    JOIN product_variants pv ON oi.variant_id = pv.id 
    JOIN products p ON pv.product_id = p.id 
    JOIN orders o ON oi.order_id = o.id 
    WHERE o.status = 'completed' 
    GROUP BY p.id 
    ORDER BY totalSold DESC LIMIT 5
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi sản phẩm bán chạy" });
    res.json(rows);
  });
};

exports.getUncompletedOrders = (req, res) => {
  db.query(
    "SELECT COUNT(*) AS totalUncompleted FROM orders WHERE status IN ('pending', 'confirmed')",
    (err, rows) => {
      if (err)
        return res.status(500).json({ message: "Lỗi đơn chưa hoàn thành" });
      res.json(rows[0]);
    },
  );
};
