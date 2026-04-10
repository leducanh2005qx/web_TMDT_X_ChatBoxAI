const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const db = require("../config/db");

// =======================
// REGISTER (CHỈ CUSTOMER)
// =======================
exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    name,
    email,
    phone, // ✅ THÊM
    password: hashedPassword,
    role_id: 5, // CUSTOMER
    status: "active",
  };

  User.create(newUser, (err) => {
    if (err) {
      return res.status(500).json({ message: "Email đã tồn tại" });
    }

    res.json({ message: "Register successful" });
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
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
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
