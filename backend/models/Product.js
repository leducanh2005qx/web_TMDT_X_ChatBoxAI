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

  // CREATE (có category_id)
  create: (product, callback) => {
    const sql = `
      INSERT INTO products (name, price, description, stock, image, category_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      product.name,
      product.price,
      product.description,
      product.stock,
      product.image,
      product.category_id || null,
    ];

    db.query(sql, params, callback);
  },

  // UPDATE (có category_id)
  update: (id, product, callback) => {
    let sql = `
      UPDATE products
      SET name = ?, price = ?, description = ?, stock = ?, category_id = ?
    `;
    const params = [
      product.name,
      product.price,
      product.description,
      product.stock,
      product.category_id || null,
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
