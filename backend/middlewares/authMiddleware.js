const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token không tồn tại" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token sai định dạng" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(`[DEBUG] authMiddleware Decoded - ID: ${decoded.id}, Role: ${decoded.role}`);

    // TRUY VẤN DATABASE ĐỂ KIỂM TRA TRẠNG THÁI MỚI NHẤT
    User.findById(decoded.id, (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Lỗi kiểm tra trạng thái tài khoản" });
      }

      if (result.length === 0) {
        return res.status(401).json({ message: "Người dùng không tồn tại" });
      }

      const user = result[0];
      if (user.is_active === 0 || user.is_active === false) {
        return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa." });
      }

      req.user = {
        id: user.id,
        role: user.role_name,
        is_active: user.is_active
      };

      next();
    });
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};
