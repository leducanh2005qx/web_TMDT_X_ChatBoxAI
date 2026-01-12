const db = require("../config/db");

const User = {
  findByEmail: (email, callback) => {
    const sql = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.password,
        r.name AS role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
    `;

    db.query(sql, [email], callback);
  },

  create: (user, callback) => {
    const sql = `
      INSERT INTO users (name, email, password, role_id)
      VALUES (?, ?, ?, ?)
    `;
    db.query(
      sql,
      [user.name, user.email, user.password, user.role_id],
      callback
    );
  },
};

module.exports = User;
