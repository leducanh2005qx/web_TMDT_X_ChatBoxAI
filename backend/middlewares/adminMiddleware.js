module.exports = (req, res, next) => {
  // authMiddleware phải chạy trước
  if (!req.user) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }

  // role có thể là: 'ADMIN' | 'CUSTOMER'
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Không có quyền admin" });
  }

  next();
};
