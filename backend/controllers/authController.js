const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const db = require("../config/db");

// =======================
// REGISTER (CHỈ CUSTOMER)
// =======================
exports.register = async (req, res) => {
  const { name, email, password, phone, birthday } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    name,
    email,
    phone,
    password: hashedPassword,
    role_id: 5, // CUSTOMER
    status: "active",
  };

  User.create(newUser, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Email đã tồn tại" });
    }

    // Lấy ID user vừa tạo
    db.query("SELECT id FROM users WHERE email = ?", [email], (errFind, rows) => {
      const newUserId = rows?.[0]?.id;

      // Lưu birthday nếu có
      if (birthday && newUserId) {
        db.query("UPDATE users SET birthday = ? WHERE id = ?", [birthday, newUserId]);
      }

      if (newUserId) {
        // 🎁 Tặng Voucher 50% độc quyền của sếp Đức Anh
        const code = `CHAO_MUNG_TVM_50_${newUserId}`;
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + 30); // HSD 30 ngày
        const startStr = now.toISOString().slice(0, 10);
        const endStr = endDate.toISOString().slice(0, 10);

        db.query(
          `INSERT INTO vouchers (code, type, value, min_order_value, max_discount, quantity, used, start_date, end_date, status, source)
           VALUES (?, 'percent', 50, 50000, 100000, 1, 0, ?, ?, 'active', 'WELCOME')`,
          [code, startStr, endStr],
          (errVoucher, resultVoucher) => {
            if (!errVoucher && resultVoucher.insertId) {
              const voucherId = resultVoucher.insertId;
              db.query("INSERT INTO user_vouchers (user_id, voucher_id, used) VALUES (?, ?, 0)", [newUserId, voucherId]);
            }
          }
        );

        const giftMessage = `Chúc mừng sếp Đức Anh! Đã gửi tặng Voucher độc quyền giảm 50% (tối đa 100.000đ) mã ${code} vào ví của sếp.`;
        return res.json({ 
          message: "Register successful", 
          welcomeVoucher: true,
          giftMessage
        });
      }

      res.json({ message: "Register successful", welcomeVoucher: false });
    });
  });
};

// =======================
// LOGIN (ADMIN / CUSTOMER)
// =======================
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
  }

  User.findByEmail(email, (err, result) => {
    if (err) return res.status(500).json({ message: "Lỗi truy vấn người dùng" });

    if (result.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

     const user = result[0];

    if (user.status === "pending") {
      return res.status(403).json({
        message: "Tài khoản đang chờ duyệt. Vui lòng liên hệ Admin.",
      });
    }

    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị khóa, vui lòng liên hệ sếp Đức Anh!",
      });
    }

    let isMatch = false;
    try {
      isMatch = bcrypt.compareSync(password, user.password);
    } catch (compareErr) {
      // Support legacy plain-text passwords to avoid server crash.
      isMatch = password === user.password;
    }
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    // 🔑 TOKEN DÙNG ENV (GIỮ NGUYÊN)
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_name, // "ADMIN" | "CUSTOMER"
        is_active: user.is_active,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    const sendLoginResponse = (aiReminder = null) => {
      res.json({
        message: "Login successful",
        token,
        role: user.role_name,
        aiReminder,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar || null,
        },
      });
    };

    // Tiger reminder for Admin
    if (user.role_id === 1) {
      db.query(
        "SELECT COUNT(*) AS totalPending FROM users WHERE role_id = 3 AND status = 'pending'",
        (countErr, countRows) => {
          if (countErr) return sendLoginResponse();
          const totalPending = countRows?.[0]?.totalPending || 0;
          const aiReminder = `Chào Đức Anh, có ${totalPending} nhân viên mới đang chờ bạn phê duyệt!`;
          return sendLoginResponse(aiReminder);
        },
      );
      return;
    }

    // Tiger reminder for Manager
    if (user.role_id === 2) {
      const sql = `
        SELECT name
        FROM users
        WHERE role_id = 3 AND created_by = ? AND status = 'pending'
        ORDER BY id DESC
        LIMIT 1
      `;
      db.query(sql, [user.id], (latestErr, latestRows) => {
        if (latestErr) return sendLoginResponse();
        const latestStaffName = latestRows?.[0]?.name;
        if (!latestStaffName) return sendLoginResponse();
        const aiReminder = `Chào bạn, nhân viên ${latestStaffName} bạn vừa thêm đang chờ Admin duyệt`;
        return sendLoginResponse(aiReminder);
      });
      return;
    }

    return sendLoginResponse();
  });
};
