const db = require("../config/db");

/* =========================
   VOUCHER CÓ THỂ NHẬN
   - status = 'active'
   - còn lượt (quantity > used)
   - trong thời gian (start_date/end_date)
   - user chưa nhận (NOT IN user_vouchers)
========================= */
exports.getAvailable = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT v.*
    FROM vouchers v
    WHERE v.status = 'active'
      AND v.quantity > v.used
      AND (v.start_date IS NULL OR v.start_date <= CURDATE())
      AND (v.end_date IS NULL OR v.end_date >= CURDATE())
      AND v.voucher_id NOT IN (
        SELECT voucher_id
        FROM user_vouchers
        WHERE user_id = ?
      )
    ORDER BY v.created_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi voucher" });
    }
    res.json(rows);
  });
};

/* =========================
   NHẬN VOUCHER
   - insert vào user_vouchers
   - UNIQUE(user_id, voucher_id) sẽ tự chặn nhận trùng
========================= */
exports.receiveVoucher = (req, res) => {
  const userId = req.user.id;
  const { voucherId } = req.params;

  // (Optional) check nhanh voucher còn hợp lệ trước khi nhận
  const checkSql = `
    SELECT voucher_id
    FROM vouchers
    WHERE voucher_id = ?
      AND status = 'active'
      AND quantity > used
      AND (start_date IS NULL OR start_date <= CURDATE())
      AND (end_date IS NULL OR end_date >= CURDATE())
    LIMIT 1
  `;

  db.query(checkSql, [voucherId], (checkErr, checkRows) => {
    if (checkErr) {
      console.error(checkErr);
      return res.status(500).json({ message: "Lỗi hệ thống" });
    }

    if (!checkRows || checkRows.length === 0) {
      return res
        .status(400)
        .json({ message: "Voucher không hợp lệ hoặc đã hết" });
    }

    const sql = `
      INSERT INTO user_vouchers (user_id, voucher_id)
      VALUES (?, ?)
    `;

    db.query(sql, [userId, voucherId], (err) => {
      if (err) {
        // thường là duplicate do UNIQUE(user_id, voucher_id)
        return res
          .status(400)
          .json({ message: "Voucher đã được nhận trước đó" });
      }

      res.json({ success: true, message: "🎉 Nhận voucher thành công" });
    });
  });
};

/* =========================
   VOUCHER CỦA TÔI (để checkout)
   - chỉ lấy voucher chưa dùng (uv.used = 0)
   - voucher còn active + còn hạn
========================= */
exports.getMyVouchers = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT v.*, uv.used, uv.received_at
    FROM user_vouchers uv
    JOIN vouchers v ON uv.voucher_id = v.voucher_id
    WHERE uv.user_id = ?
      AND uv.used = 0
      AND v.status = 'active'
      AND v.quantity > v.used
      AND (v.start_date IS NULL OR v.start_date <= CURDATE())
      AND (v.end_date IS NULL OR v.end_date >= CURDATE())
    ORDER BY uv.received_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi voucher user" });
    }
    res.json(rows);
  });
};
