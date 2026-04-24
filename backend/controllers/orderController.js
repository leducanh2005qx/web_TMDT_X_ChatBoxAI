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
    if (err) {
      console.error("Lỗi getOrdersByUser:", err.message);
      return res.status(500).json({ message: "Lỗi lấy đơn hàng" });
    }
    res.json(rows.map(r => ({ ...r, totalSold: r.totalSold?Number(r.totalSold):undefined, total_revenue: r.total_revenue?Number(r.total_revenue):undefined, revenue: r.revenue?Number(r.revenue):undefined, count: r.count?Number(r.count):undefined })));
  });
};

exports.getOrderDetail = (req, res) => {
  const sql = `
    SELECT o.id AS orderId, o.total, o.status, o.created_at, o.receiver_name, o.receiver_phone, 
           o.shipping_address, o.expected_delivery, o.payment_method,
           p.id AS product_id, p.name, p.image, pv.variant_name, oi.quantity, oi.price
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
        product_id: r.product_id,
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
    if (err) {
      console.error("Lỗi getAllOrdersAdmin:", err.message);
      return res.status(500).json({ message: "Lỗi admin orders" });
    }
    res.json(rows.map(r => ({ ...r, totalSold: r.totalSold?Number(r.totalSold):undefined, total_revenue: r.total_revenue?Number(r.total_revenue):undefined, revenue: r.revenue?Number(r.revenue):undefined, count: r.count?Number(r.count):undefined })));
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
  const { status } = req.body;
  const orderId = req.params.id;
  const actorId = req.user.id;

  // 1. Lấy trạng thái cũ
  db.query("SELECT status FROM orders WHERE id = ?", [orderId], (errRows, rows) => {
    if (errRows || !rows.length) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    const oldStatus = rows[0].status;

    // 2. Cập nhật (Thêm processed_by để tính hoa hồng cho nhân viên)
    const sql = "UPDATE orders SET status = ?, processed_by = ? WHERE id = ?";
    db.query(
      sql,
      [status, actorId, orderId],
      (err) => {
        if (err) {
          console.error("Lỗi updateOrderStatus:", err.message);
          return res.status(500).json({ message: "Lỗi cập nhật" });
        }

        // Ghi log chi tiết
        const logAction = `Đã đổi trạng thái đơn hàng #${orderId} từ ${oldStatus.toUpperCase()} sang ${status.toUpperCase()}`;
        db.query(
          "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
          [actorId, logAction, orderId]
        );

        res.json({ success: true });
      },
    );
  });
};

/* =====================================================
   CANCEL ORDER – Staff & Customer (stock restore)
===================================================== */
exports.cancelOrder = (req, res) => {
  const orderId = req.params.id;
  const userId  = req.user.id;
  const userRole = String(req.user.role || "").toUpperCase();
  const { reason } = req.body;

  // Staff PHẢI có lý do hủy
  if (userRole === "STAFF" && !reason?.trim()) {
    return res.status(400).json({ message: "Staff phải nhập lý do hủy đơn" });
  }

  // 1. Lấy đơn hàng để kiểm tra quyền và trạng thái
  const getOrderSql = `
    SELECT o.id, o.status, o.user_id,
           oi.variant_id, oi.quantity
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = ?
  `;

  db.query(getOrderSql, [orderId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi truy vấn đơn hàng" });
    if (!rows.length) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

    const order = rows[0];

    // Khách hàng chỉ hủy đơn của mình và chỉ khi Pending
    if (userRole !== "STAFF" && userRole !== "ADMIN" && userRole !== "MANAGER") {
      if (order.user_id !== userId) {
        return res.status(403).json({ message: "Bạn không có quyền hủy đơn hàng này" });
      }
      if (order.status !== "pending") {
        return res.status(400).json({ message: "Chỉ có thể hủy đơn hàng ở trạng thái Pending" });
      }
    }

    // Không hủy đơn đã completed
    if (order.status === "completed" || order.status === "cancelled") {
      return res.status(400).json({ message: `Không thể hủy đơn hàng đã ${order.status}` });
    }

    db.beginTransaction((txErr) => {
      if (txErr) return res.status(500).json({ message: "Lỗi transaction" });

      // 2. Cập nhật trạng thái đơn
      const cancelNote = reason ? `Lý do: ${reason}` : null;
      db.query(
        "UPDATE orders SET status = 'cancelled', cancel_reason = ? WHERE id = ?",
        [cancelNote, orderId],
        (updateErr) => {
          if (updateErr) {
            return db.rollback(() =>
              res.status(500).json({ message: "Lỗi hủy đơn hàng" })
            );
          }

          // 3. HOÀN TRẢ KHO – Cộng lại stock cho từng variant
          const restorePromises = rows.map(item => {
            return new Promise((resolve, reject) => {
              db.query(
                "UPDATE product_variants SET stock = stock + ? WHERE id = ?",
                [item.quantity, item.variant_id],
                (stockErr) => {
                  if (stockErr) reject(stockErr);
                  else resolve();
                }
              );
            });
          });

          Promise.all(restorePromises)
            .then(() => {
              db.commit((commitErr) => {
                if (commitErr) {
                  return db.rollback(() =>
                    res.status(500).json({ message: "Lỗi commit transaction" })
                  );
                }

                // Ghi log hủy đơn
                const logAction = `Đã hủy đơn hàng #${orderId}. ${reason ? `Lý do: ${reason}` : ""}`;
                db.query(
                  "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
                  [req.user.id, logAction, orderId]
                );

                res.json({ success: true, message: "Đã hủy đơn hàng và hoàn trả kho thành công" });
              });
            })
            .catch((stockErr) => {
              db.rollback(() =>
                res.status(500).json({ message: "Lỗi hoàn trả kho: " + stockErr.message })
              );
            });
        }
      );
    });
  });
};


/* =====================================================
    STATISTICS (GIỮ NGUYÊN)
===================================================== */
exports.getStatistics = (req, res) => {
  const categoryId = req.query.categoryId;
  
  if (categoryId) {
    const sql = `
      SELECT 
        COUNT(DISTINCT o.id) AS totalOrders,
        SUM(oi.quantity * oi.price) AS totalRevenue,
        COUNT(DISTINCT o.user_id) AS totalCustomers
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE o.status = 'completed' AND p.category_id = ?
    `;
    db.query(sql, [categoryId], (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi thống kê theo category" });
      res.json(rows[0] || { totalOrders: 0, totalRevenue: 0, totalCustomers: 0 });
    });
  } else {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE status = 'completed') AS totalOrders,
        (SELECT IFNULL(SUM(total), 0) FROM orders WHERE status = 'completed') AS totalRevenue,
        (SELECT COUNT(*) FROM users) AS totalCustomers
    `;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi thống kê" });
      res.json(rows[0]);
    });
  }
};

exports.getBestSellingProducts = (req, res) => {
  const categoryId = req.query.categoryId;
  const params = categoryId ? [categoryId] : [];
  const categoryFilter = categoryId ? " AND p.category_id = ? " : "";

  const sql = `
    SELECT p.id, p.name, p.image, SUM(oi.quantity) AS totalSold 
    FROM order_items oi 
    JOIN product_variants pv ON oi.variant_id = pv.id 
    JOIN products p ON pv.product_id = p.id 
    JOIN orders o ON oi.order_id = o.id 
    WHERE o.status = 'completed' ${categoryFilter}
    GROUP BY p.id 
    ORDER BY totalSold DESC LIMIT 5
  `;
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi sản phẩm bán chạy" });
    res.json(rows);
  });
};

exports.getTopProfitProducts = (req, res) => {
  const categoryId = req.query.categoryId;
  const params = categoryId ? [categoryId] : [];
  const categoryFilter = categoryId ? " AND p.category_id = ? " : "";

  const sql = `
    SELECT p.id, p.name, p.image, SUM(oi.quantity * oi.price) AS totalRevenue 
    FROM order_items oi 
    JOIN product_variants pv ON oi.variant_id = pv.id 
    JOIN products p ON pv.product_id = p.id 
    JOIN orders o ON oi.order_id = o.id 
    WHERE o.status = 'completed' ${categoryFilter}
    GROUP BY p.id 
    ORDER BY totalRevenue DESC LIMIT 5
  `;
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi sản phẩm lợi nhuận" });
    const results = rows.map(r => ({
      ...r,
      totalProfit: r.totalRevenue * 0.35,
      totalSold: r.totalRevenue
    }));
    res.json(results);
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

exports.getCategoryRevenue = (req, res) => {
  const categoryId = req.query.categoryId;
  const params = categoryId ? [categoryId] : [];
  const categoryFilter = categoryId ? " AND p.category_id = ? " : "";

  const sql = `
    SELECT c.name AS category_name, SUM(oi.quantity * oi.price) AS total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN product_variants pv ON oi.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE o.status = 'completed' ${categoryFilter}
    GROUP BY c.id, c.name
    ORDER BY total_revenue DESC
  `;
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi doanh thu theo danh mục" });
    res.json(rows);
  });
};

exports.getMonthlyRevenue = (req, res) => {
  const categoryId = req.query.categoryId;
  if (!categoryId) {
    const sql = `
      SELECT 
        DATE_FORMAT(created_at, '%m/%Y') AS label,
        SUM(total) AS revenue
      FROM orders
      WHERE status = 'completed'
      GROUP BY label
      ORDER BY MIN(created_at) ASC
      LIMIT 12
    `;
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi thống kê theo tháng: " + err.message });
      res.json(rows);
    });
  } else {
    const sql = `
      SELECT 
        DATE_FORMAT(o.created_at, '%m/%Y') AS label,
        SUM(oi.quantity * oi.price) AS revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE o.status = 'completed' AND p.category_id = ?
      GROUP BY label
      ORDER BY MIN(o.created_at) ASC
      LIMIT 12
    `;
    db.query(sql, [categoryId], (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi thống kê theo tháng: " + err.message });
      res.json(rows);
    });
  }
};

exports.getWeeklyRevenue = (req, res) => {
  const sql = `
    SELECT 
      DATE_FORMAT(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), '%d/%m') AS label,
      SUM(total) AS revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY label
    ORDER BY MIN(created_at) ASC
    LIMIT 8
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi thống kê theo tuần: " + err.message });
    res.json(rows.map(r => ({ ...r, totalSold: r.totalSold?Number(r.totalSold):undefined, total_revenue: r.total_revenue?Number(r.total_revenue):undefined, revenue: r.revenue?Number(r.revenue):undefined, count: r.count?Number(r.count):undefined })));
  });
};
exports.getMonthlyCustomerGrowth = (req, res) => {
  const sql = `
    SELECT 
      DATE_FORMAT(created_at, '%m/%Y') AS label,
      COUNT(*) AS count
    FROM users
    GROUP BY label
    ORDER BY MIN(created_at) ASC
    LIMIT 12
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi thống kê tăng trưởng khách hàng: " + err.message });
    res.json(rows.map(r => ({ ...r, totalSold: r.totalSold?Number(r.totalSold):undefined, total_revenue: r.total_revenue?Number(r.total_revenue):undefined, revenue: r.revenue?Number(r.revenue):undefined, count: r.count?Number(r.count):undefined })));
  });
};

/* ================= STAFF WORKSPACE EXTRAS ================= */

/**
 * Gửi hóa đơn Email cho khách (Staff gọi)
 */
exports.sendInvoiceAPI = async (req, res) => {
  const orderId = req.params.id;

  try {
    // 1. Lấy thông tin đơn hàng + User Email
    const sqlMatch = `
      SELECT o.*, u.email 
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;

    db.query(sqlMatch, [orderId], async (err, rows) => {
      if (err || !rows.length) return res.status(404).json({ message: "Không tìm thấy đơn hoặc email khách" });
      
      const order = rows[0];

      // 2. Lấy danh sách sản phẩm trong đơn
      const sqlItems = `
        SELECT oi.*, p.name 
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `;

      db.query(sqlItems, [orderId], async (errItems, itemRows) => {
        if (errItems) return res.status(500).json({ message: "Lỗi lấy chi tiết sản phẩm" });

        order.items = itemRows;

        // 3. Gọi mailService
        const { sendInvoice } = require("../services/mailService");
        try {
          await sendInvoice(order);
          
          // Ghi log
          db.query(
            "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
            [req.user.id, `Đã gửi hóa đơn đơn hàng #${orderId} tới email ${order.email}`, orderId]
          );

          res.json({ success: true, message: "Đã gửi hóa đơn thành công" });
        } catch (mailErr) {
          console.error("Mail error:", mailErr);
          res.status(500).json({ message: "Lỗi gửi email: " + mailErr.message });
        }
      });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Tạo yêu cầu hoàn tiền (Staff gọi)
 */
exports.requestRefundAPI = (req, res) => {
  const orderId = req.params.id;
  const { reason } = req.body;

  if (!reason) return res.status(400).json({ message: "Vui lòng nhập lý do hoàn trả" });

  const sql = `
    INSERT INTO staff_requests (staff_id, order_id, request_type, request_date, reason, status)
    VALUES (?, ?, 'refund', CURDATE(), ?, 'pending')
  `;

  db.query(sql, [req.user.id, orderId, reason], (err) => {
    if (err) {
      console.error("Lỗi requestRefund:", err.message);
      return res.status(500).json({ message: "Lỗi tạo yêu cầu" });
    }

    // Ghi log
    const logAction = `Đã tạo yêu cầu hoàn trả cho đơn hàng #${orderId}. Lý do: ${reason}`;
    db.query(
      "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
      [req.user.id, logAction, orderId]
    );

    res.json({ success: true, message: "Đã gửi yêu cầu hoàn trả tới Manager" });
  });
};
