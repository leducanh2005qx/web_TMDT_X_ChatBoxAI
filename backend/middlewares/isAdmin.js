const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Không có quyền truy cập" });
  }

  const rawRole = req.user.role;
  const userRoleStr = String(rawRole || "").trim().toUpperCase();
  
  console.log(`[DEBUG] Check isAdmin - UserID: ${req.user.id}, Role: ${rawRole} (type: ${typeof rawRole})`);

  const allowedRoles = ["ADMIN", "MANAGER"];
  if (allowedRoles.includes(userRoleStr) || rawRole === 1 || rawRole === 2) {
    return next();
  }

  return res.status(403).json({ 
    message: "Forbidden: Chỉ Admin hoặc Manager mới có quyền thực hiện hành động này!" 
  });
};

module.exports = isAdmin;
