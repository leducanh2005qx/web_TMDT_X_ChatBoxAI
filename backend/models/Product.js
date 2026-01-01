const db = require("../config/db");

const Product = {
  // ================= GET ALL =================
  getAll: (callback) => {
    const sql = "SELECT * FROM products";
    db.query(sql, callback);
  },

  // ================= CREATE =================
  create: (product, callback) => {
    // product lúc này có:
    // name, price, description, stock, image
    const sql = `
      INSERT INTO products (name, price, description, stock, image)
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      product.name,
      product.price,
      product.description,
      product.stock,
      product.image,
    ];

    db.query(sql, params, callback);
  },

  // ================= UPDATE =================
  update: (id, product, callback) => {
    let sql = `
      UPDATE products 
      SET name = ?, price = ?, description = ?, stock = ?
    `;
    const params = [
      product.name,
      product.price,
      product.description,
      product.stock,
    ];

    // ✅ Nếu có ảnh mới → update ảnh
    if (product.image) {
      sql += ", image = ?";
      params.push(product.image);
    }

    sql += " WHERE id = ?";
    params.push(id);

    db.query(sql, params, callback);
  },

  // ================= DELETE =================
  delete: (id, callback) => {
    const sql = "DELETE FROM products WHERE id = ?";
    db.query(sql, [id], callback);
  },
};

module.exports = Product;
