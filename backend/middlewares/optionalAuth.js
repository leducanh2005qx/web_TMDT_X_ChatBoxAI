const jwt = require("jsonwebtoken");

// Middleware tùy chọn: parse token nếu có, không block nếu không có
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(); // không có token → bỏ qua, tiếp tục

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // gán user nếu token hợp lệ
  } catch {
    // token sai → không gán user, vẫn cho qua (public route)
  }
  next();
};
