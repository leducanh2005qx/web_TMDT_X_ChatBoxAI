module.exports = (roleOrRoles) => {
  return (req, res, next) => {
    const userRole = String(req.user.role || "").toUpperCase();
    const allowedRoles = Array.isArray(roleOrRoles)
      ? roleOrRoles.map((r) => String(r || "").toUpperCase())
      : [String(roleOrRoles || "").toUpperCase()];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
