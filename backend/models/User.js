const db = require("../config/db");

const User = {
  // 🔍 Tìm user theo email + role name
  findByEmail: (email, callback) => {
    const sql = `
      SELECT users.*, roles.name AS role_name
      FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.email = ?
    `;
    db.query(sql, [email], callback);
  },

  // 🔍 Kiểm tra email đã tồn tại chưa
  checkEmailExists: (email, callback) => {
    const sql = "SELECT id FROM users WHERE email = ?";
    db.query(sql, [email], callback);
  },

  // 🔍 Kiểm tra đã có admin chưa (chỉ cho 1 admin)
  checkAdminExists: (callback) => {
    const sql = `
      SELECT users.id
      FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE roles.name = 'ADMIN'
      LIMIT 1
    `;
    db.query(sql, callback);
  },

  // ➕ Tạo user mới
  create: (user, callback) => {
    const sql = "INSERT INTO users SET ?";
    db.query(sql, user, callback);
  },
};

module.exports = User;
