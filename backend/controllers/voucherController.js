const db = require("../config/db");

/* ================= ADMIN ================= */

/* ===== GET ALL (ADMIN) ===== */
exports.getAll = (req, res) => {
  db.query("SELECT * FROM vouchers ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi lấy voucher" });
    res.json(rows);
  });
};

/* ===== CREATE (ADMIN) ===== */
exports.create = (req, res) => {
  const {
    code,
    type,
    value,
    min_order_value,
    max_discount,
    quantity,
    start_date,
    end_date,
    status, // Nhận status từ frontend nếu bạn có truyền
  } = req.body;

  if (!code || !type || !value || !quantity) {
    return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
  }

  db.query(
    `INSERT INTO vouchers 
     (code, type, value, min_order_value, max_discount, quantity, start_date, end_date, used, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      code,
      type,
      value,
      min_order_value,
      max_discount,
      quantity,
      start_date,
      end_date,
      status || "active", // Nếu trang admin không gửi status thì mới để mặc định
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res
          .status(400)
          .json({ message: "Lỗi lưu Database (Có thể trùng mã)" });
      }
      // Ghi log
      db.query(
        "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
        [req.user.id, `Đã tạo voucher mới: ${code}`, 0]
      );
      res.json({ success: true });
    },
  );
};

/* ===== UPDATE (ADMIN) ===== */
exports.update = (req, res) => {
  const { id } = req.params;
  const {
    type,
    value,
    min_order_value,
    max_discount,
    quantity,
    start_date,
    end_date,
  } = req.body;

  // 1. Lấy thông tin cũ
  db.query("SELECT code FROM vouchers WHERE voucher_id = ?", [id], (errRows, rows) => {
    if (errRows || !rows.length) return res.status(404).json({ message: "Không tìm thấy voucher" });
    const voucherCode = rows[0].code;

    // 2. Cập nhật
    db.query(
      `UPDATE vouchers SET
        type=?, value=?, min_order_value=?, max_discount=?,
        quantity=?, start_date=?, end_date=?
       WHERE voucher_id=?`,
      [type, value, min_order_value, max_discount, quantity, start_date, end_date, id],
      (err) => {
        if (err) return res.status(500).json({ message: "Lỗi cập nhật voucher" });
        
        // Ghi log chi tiết
        const logAction = `Đã cập nhật thông tin voucher '${voucherCode}' (ID: ${id})`;
        db.query(
          "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
          [req.user.id, logAction, id]
        );
        res.json({ success: true });
      },
    );
  });
};

/* ===== TOGGLE (ADMIN) ===== */
exports.toggle = (req, res) => {
  const { id } = req.params;

  // 1. Lấy trạng thái cũ
  db.query("SELECT status FROM vouchers WHERE voucher_id = ?", [id], (errRows, rows) => {
    if (errRows || !rows.length) return res.status(404).json({ message: "Không tìm thấy voucher" });
    const oldStatus = rows[0].status;
    const newStatus = oldStatus === 'active' ? 'inactive' : 'active';

    // 2. Cập nhật
    db.query(
      "UPDATE vouchers SET status = ? WHERE voucher_id=?",
      [newStatus, id],
      (err) => {
        if (err) return res.status(500).json({ message: "Lỗi toggle voucher" });
        
        // Ghi log chi tiết
        const logAction = `Đã đổi trạng thái voucher #${id} từ ${oldStatus.toUpperCase()} sang ${newStatus.toUpperCase()}`;
        db.query(
          "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
          [req.user.id, logAction, id]
        );
        res.json({ success: true });
      },
    );
  });
};

/* ================= CUSTOMER ================= */

exports.getAvailable = (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  db.query(
    `SELECT * FROM vouchers
     WHERE status='active'
       AND start_date <= ?
       AND end_date >= ?
       AND used < quantity
     ORDER BY created_at DESC`,
    [today, today],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi lấy voucher" });
      res.json(rows);
    },
  );
};

exports.apply = (req, res) => {
  const { code, total } = req.body;
  if (!code || !total)
    return res.status(400).json({ message: "Thiếu dữ liệu" });
  const today = new Date().toISOString().slice(0, 10);

  db.query(
    `SELECT * FROM vouchers
     WHERE code=?
       AND status='active'
       AND start_date <= ?
       AND end_date >= ?
       AND used < quantity
     LIMIT 1`,
    [code, today, today],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Lỗi hệ thống" });
      if (rows.length === 0)
        return res.status(400).json({ message: "Voucher không hợp lệ" });

      const v = rows[0];
      if (total < v.min_order_value) {
        return res
          .status(400)
          .json({
            message: `Đơn tối thiểu ${v.min_order_value.toLocaleString()} đ`,
          });
      }

      let discount =
        v.type === "percent"
          ? Math.min(
              Math.floor((total * v.value) / 100),
              v.max_discount || Infinity,
            )
          : v.value;

      res.json({ code: v.code, discount, finalTotal: total - discount });
    },
  );
};
