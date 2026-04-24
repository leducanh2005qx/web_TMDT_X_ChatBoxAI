const db = require("../config/db");

const User = {
  findByEmail: (email, callback) => {
    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.password,
        u.role_id,
        u.status,
        u.is_active,
        u.avatar,
        r.name AS role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `;

    db.query(sql, [email], callback);
  },

  create: (user, callback) => {
    const sql = `
      INSERT INTO users (name, email, password, role_id, phone, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
      sql,
      [
        user.name,
        user.email,
        user.password,
        user.role_id,
        user.phone || null,
        user.status || "active",
      ],
      callback
    );
  },
  findById: (id, callback) => {
    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.password,
        u.role_id,
        u.status,
        u.is_active,
        u.avatar,
        r.name AS role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `;

    db.query(sql, [id], callback);
  },
};

module.exports = User;
