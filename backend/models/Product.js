const db = require("../config/db");

const Product = {
  // GET ALL (kèm category name)
  getAll: (callback) => {
    const sql = `
      SELECT p.*, c.name AS category
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `;
    db.query(sql, callback);
  },

  // CREATE (có thêm các trường mới)
  create: (product, callback) => {
    const sql = `
      INSERT INTO products (name, price, description, stock, image, category_id, status, manager_id, display_type, specifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      product.name,
      product.price,
      product.description,
      product.stock,
      product.image,
      product.category_id || null,
      product.status || 'pending',
      product.manager_id || null,
      product.display_type || 'general',
      product.specifications || '{}'
    ];

    db.query(sql, params, callback);
  },

  // GET PENDING (Dành cho Admin duyệt)
  getPending: (callback) => {
    const sql = `
      SELECT p.*, c.name AS category_name, u.name AS manager_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.status = 'pending' AND p.deleted_at IS NULL
      ORDER BY p.id DESC
    `;
    db.query(sql, callback);
  },

  // GET DECIDED (Lịch sử đã duyệt / từ chối)
  getDecided: (callback) => {
    const sql = `
      SELECT p.*, c.name AS category_name, u.name AS manager_name,
        a.name AS decided_by_name,
        p.rejection_reason
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.manager_id = u.id
      LEFT JOIN users a ON a.role_id = 1
      WHERE p.status IN ('active', 'hidden') AND p.deleted_at IS NULL
      ORDER BY p.id DESC
      LIMIT 200
    `;
    db.query(sql, callback);
  },

  // UPDATE STATUS (Duyệt hoặc Từ chối)
  updateStatus: (id, status, reason, callback) => {
    const sql = "UPDATE products SET status = ?, rejection_reason = ? WHERE id = ?";
    db.query(sql, [status, reason || null, id], callback);
  },

  // UPDATE (có thêm trường status)
  update: (id, product, callback) => {
    let sql = `
      UPDATE products
      SET name = ?, price = ?, description = ?, stock = ?, category_id = ?, display_type = ?, specifications = ?, status = ?
    `;
    const params = [
      product.name,
      product.price,
      product.description,
      product.stock,
      product.category_id || null,
      product.display_type || 'general',
      product.specifications || '{}',
      product.status || 'pending'
    ];

    if (product.image) {
      sql += ", image = ?";
      params.push(product.image);
    }

    sql += " WHERE id = ?";
    params.push(id);

    db.query(sql, params, callback);
  },

  // DELETE
  delete: (id, callback) => {
    const sql = "DELETE FROM products WHERE id = ?";
    db.query(sql, [id], callback);
  },
};

module.exports = Product;
