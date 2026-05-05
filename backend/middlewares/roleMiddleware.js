module.exports = (roleOrRoles) => {
  return (req, res, next) => {
    const rawRole = req.user.role;
    const userRoleStr = String(rawRole || "").trim().toUpperCase();
    
    // Đưa tất cả role yêu cầu về chữ hoa để so sánh chính xác
    const allowedRoles = (Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles])
      .map(r => String(r || "").trim().toUpperCase());

    // Tắt log để tránh làm rác màn hình
    // console.log(`[DEBUG] Check roleMiddleware - Required: ${allowedRoles}, Actual: ${userRoleStr}`);

    if (!allowedRoles.includes(userRoleStr)) {
      return res.status(403).json({ 
        message: `Access denied. Yêu cầu một trong các quyền: ${allowedRoles.join(' / ')}` 
      });
    }
    next();
  };
};
