const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET_KEY = "SECRET_KEY";

// =======================
// REGISTER (CHỈ CUSTOMER)
// =======================
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const newUser = {
    name,
    email,
    password: hashedPassword,
    role_id: 5, // ✅ CUSTOMER
  };

  User.create(newUser, (err) => {
    if (err) {
      // Email trùng
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

  // ⚠️ findByEmail PHẢI JOIN roles
  User.findByEmail(email, (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = result[0];

    // Check password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong password" });
    }

    // 🔑 Token chứa role name
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_name, // "ADMIN" | "CUSTOMER"
      },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    // ✅ Trả role dạng CHUỖI
    res.json({
      message: "Login successful",
      token,
      role: user.role_name,
    });
  });
};
