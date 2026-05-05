const db = require("../config/db");
const Chat = require("../models/Chat");

/* =====================================================
    USER – CREATE ORDER (HỖ TRỢ VOUCHER + PAYMENT METHOD)
===================================================== */
exports.createOrder = async (req, res) => {
  const userId = req.user?.id;
  const { items, total, shipping_address, voucher_ids, payment_method } = req.body;

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

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // 1. Get user info
    const [urows] = await connection.query("SELECT name, phone FROM users WHERE id = ?", [userId]);
    if (!urows || urows.length === 0) {
      throw new Error("Không lấy được thông tin người dùng");
    }
    const receiver_name = urows[0].name || "";
    const receiver_phone = urows[0].phone || "";

    // 2. Insert order
    const [result] = await connection.query(
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
        payment_method || "cod",
      ]
    );
    const orderId = result.insertId;

    // 3. Insert order items
    const values = items.map((i) => [
      orderId,
      i.product_id,
      i.variant_id || null,
      i.quantity,
      i.price,
      i.name || "Sản phẩm",
      i.image || null
    ]);

    await connection.query(
      "INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, product_name, product_image) VALUES ?",
      [values]
    );

    // 4. Update stock
    for (const i of items) {
      if (i.variant_id) {
        const [resultStock] = await connection.query(
          "UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?",
          [i.quantity, i.variant_id, i.quantity]
        );
        if (resultStock.affectedRows === 0) {
          throw new Error("Hết hàng hoặc ID variant sai. Variant ID: " + i.variant_id);
        }
      } else {
        const [resultStock] = await connection.query(
          "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
          [i.quantity, i.product_id, i.quantity]
        );
        if (resultStock.affectedRows === 0) {
          throw new Error("Hết hàng (sản phẩm chính). Product ID: " + i.product_id);
        }
      }
    }

    // 5. Handle Voucher
    if (voucher_ids && Array.isArray(voucher_ids) && voucher_ids.length > 0) {
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
      const [resultV] = await connection.query(sql, [userId, voucher_ids]);
      if (resultV.affectedRows < voucher_ids.length) {
        throw new Error("Voucher không khả dụng");
      }
    }

    await connection.commit();

    // ✅ LOGIC AUTO CHAT REAL-TIME (Thông báo đơn hàng)
    Chat.getOrCreateThreadByUserId(userId, (errT, thread) => {
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
          }
        );
      }
    });

    res.json({
      success: true,
      orderId,
      expected_delivery,
    });

  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: "Lỗi tạo đơn hàng: " + err.message, error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

/* =====================================================
    USER – GET ORDERS & DETAIL (CẬP NHẬT TRƯỜNG THANH TOÁN)
===================================================== */
exports.getOrdersByUser = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT id AS orderId, total, status, created_at, receiver_name, receiver_phone, 
              shipping_address, expected_delivery, payment_method
       FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy đơn hàng" });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const [orders] = await db.promise().query(
      `SELECT id AS orderId, total, status, created_at, receiver_name, receiver_phone, 
              shipping_address, expected_delivery, payment_method 
       FROM orders WHERE id = ? AND user_id = ?`,
      [orderId, userId]
    );

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const orderInfo = orders[0];

    const [items] = await db.promise().query(
      `SELECT oi.quantity, oi.price,
              oi.product_id, 
              IFNULL(oi.product_name, p.name) AS name, 
              IFNULL(oi.product_image, p.image) AS image,
              pv.variant_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.json({
      ...orderInfo,
      items: items.map(r => ({
        product_id: r.product_id,
        name: r.name || "Sản phẩm Tiger Shop",
        variant_name: r.variant_name || null,
        image: r.image || null,
        quantity: r.quantity,
        price: r.price
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết đơn hàng", error: error.message });
  }
};

/* =====================================================
    ADMIN – MANAGEMENT (CẬP NHẬT TRƯỜNG THANH TOÁN)
===================================================== */
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT o.id AS orderId, o.total, o.status, o.created_at, o.receiver_name, o.receiver_phone, 
             o.shipping_address, o.expected_delivery, o.payment_method, u.email 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi getAllOrdersAdmin:", err.message);
    res.status(500).json({ message: "Lỗi admin orders" });
  }
};

exports.getOrderDetailAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;

    const [orders] = await db.promise().query(
      `SELECT o.id AS orderId, o.total, o.status, o.created_at, o.receiver_name, o.receiver_phone, 
              o.shipping_address, o.expected_delivery, o.payment_method, u.email,
              v.code AS voucher_code, staff.name AS staff_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN vouchers v ON o.voucher_id = v.id
       LEFT JOIN users staff ON o.processed_by = staff.id
       WHERE o.id = ?`,
      [orderId]
    );

    // Removed debug log

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const orderInfo = orders[0];

    const [items] = await db.promise().query(
      `SELECT oi.quantity, oi.price,
              oi.product_id, 
              IFNULL(oi.product_name, p.name) AS name, 
              IFNULL(oi.product_image, p.image) AS image,
              pv.variant_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN product_variants pv ON oi.variant_id = pv.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.json({
      ...orderInfo,
      items: items.map(r => ({
        product_id: r.product_id,
        name: r.name || "Sản phẩm Tiger Shop",
        variant_name: r.variant_name || null,
        image: r.image || null,
        quantity: r.quantity,
        price: r.price
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy chi tiết đơn hàng (Admin)", error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  const actorId = req.user.id;

  try {
    const [rows] = await db.promise().query("SELECT status, user_id FROM orders WHERE id = ?", [orderId]);
    if (!rows.length) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    const oldStatus = rows[0].status;
    const customerId = rows[0].user_id;

    await db.promise().query(
      "UPDATE orders SET status = ?, processed_by = ? WHERE id = ?",
      [status, actorId, orderId]
    );

    const logAction = `Đã đổi trạng thái đơn hàng #${orderId} từ ${oldStatus.toUpperCase()} sang ${status.toUpperCase()}`;
    await db.promise().query(
      "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
      [actorId, logAction, orderId]
    );

    // ✅ GỬI THÔNG BÁO REALTIME CHO KHÁCH HÀNG
    if (customerId) {
      const { createNotification } = require("./notificationController");

      const notifMap = {
        confirmed: {
          title: `Đơn hàng #${orderId} đã được soạn xong`,
          message: `Đơn hàng #${orderId} của bạn đã được soạn xong và đang chuẩn bị giao cho đơn vị vận chuyển! 🐯`,
        },
        shipping: {
          title: `Đơn hàng #${orderId} đang được giao`,
          message: `Đơn hàng #${orderId} đã được bàn giao cho shipper. Bạn sẽ nhận hàng trong 1-3 ngày! 🚚`,
        },
        completed: {
          title: `Đơn hàng #${orderId} đã hoàn tất`,
          message: `Đơn hàng #${orderId} đã giao thành công. Cảm ơn bạn đã mua sắm tại Tiger Shop! 🎉`,
        },
        cancelled: {
          title: `Đơn hàng #${orderId} đã bị hủy`,
          message: `Đơn hàng #${orderId} đã bị hủy. Nếu có thắc mắc, vui lòng liên hệ Tiger Shop qua chat.`,
        },
      };

      const notif = notifMap[status];
      if (notif) {
        createNotification(customerId, notif.title, notif.message, "order");
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi updateOrderStatus:", err.message);
    res.status(500).json({ message: "Lỗi cập nhật trạng thái đơn hàng" });
  }
};

/* =====================================================
   CANCEL ORDER – Staff & Customer (stock restore)
===================================================== */
exports.cancelOrder = async (req, res) => {
  const orderId = req.params.id;
  const userId  = req.user.id;
  const userRole = String(req.user.role || "").toUpperCase();
  const { reason } = req.body;

  if (userRole === "STAFF" && !reason?.trim()) {
    return res.status(400).json({ message: "Staff phải nhập lý do hủy đơn" });
  }

  let connection;
  try {
    connection = await db.promise().getConnection();

    const getOrderSql = `
      SELECT o.id, o.status, o.user_id,
             oi.variant_id, oi.product_id, oi.quantity
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = ?
    `;

    const [rows] = await connection.query(getOrderSql, [orderId]);
    
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

    await connection.beginTransaction();

    const cancelNote = reason ? `Lý do: ${reason}` : null;
    await connection.query(
      "UPDATE orders SET status = 'cancelled', cancel_reason = ? WHERE id = ?",
      [cancelNote, orderId]
    );

    // Hoàn trả kho
    for (const item of rows) {
      if (item.variant_id) {
        await connection.query(
          "UPDATE product_variants SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.variant_id]
        );
      } else if (item.product_id) {
        await connection.query(
          "UPDATE products SET stock = stock + ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      }
    }

    const logAction = `Đã hủy đơn hàng #${orderId}. ${reason ? `Lý do: ${reason}` : ""}`;
    await connection.query(
      "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
      [userId, logAction, orderId]
    );

    await connection.commit();

    res.json({ success: true, message: "Đã hủy đơn hàng và hoàn trả kho thành công" });

  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: "Lỗi hủy đơn hàng: " + err.message });
  } finally {
    if (connection) connection.release();
  }
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
