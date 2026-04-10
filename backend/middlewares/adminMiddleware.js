module.exports = (req, res, next) => {
  // authMiddleware phải chạy trước
  if (!req.user) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  const role = String(req.user.role || "").toUpperCase();
  if (role !== "ADMIN") {
    return res.status(403).json({ message: "Không có quyền admin" });
  }

  next();
};
