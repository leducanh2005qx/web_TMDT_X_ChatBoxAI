const db = require("../config/db");

const Product = {
  getAll: (callback) => {
    const sql = "SELECT * FROM products";
    db.query(sql, callback);
  },

  create: (product, callback) => {
    const sql = "INSERT INTO products SET ?";
    db.query(sql, product, callback);
  },

  delete: (id, callback) => {
    const sql = "DELETE FROM products WHERE id = ?";
    db.query(sql, [id], callback);
  },
};

module.exports = Product;
