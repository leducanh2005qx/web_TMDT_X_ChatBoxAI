const Product = require("../models/Product");
const db = require("../config/db");

// GET ALL
exports.getAllProducts = (req, res) => {
  Product.getAll((err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// GET BY ID (kèm category)
exports.getProductById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT p.*, c.name AS category
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    res.json(result[0]);
  });
};

// CREATE
exports.createProduct = (req, res) => {
  const { name, price, description, stock, category_id } = req.body;
  const image = req.file ? `uploads/${req.file.filename}` : null;

  if (!name || !price) {
    return res.status(400).json({ message: "Thiếu thông tin sản phẩm" });
  }

  Product.create(
    {
      name,
      price,
      description: description || "",
      stock: stock ? Number(stock) : 0,
      image,
      category_id: category_id ? Number(category_id) : null,
    },
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Thêm sản phẩm thành công",
        image,
      });
    }
  );
};

// UPDATE
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price, description, stock, category_id } = req.body;
  const image = req.file ? `uploads/${req.file.filename}` : null;

  if (!name || !price) {
    return res.status(400).json({ message: "Thiếu thông tin sản phẩm" });
  }

  Product.update(
    id,
    {
      name,
      price,
      description: description || "",
      stock: stock ? Number(stock) : 0,
      image,
      category_id: category_id ? Number(category_id) : null,
    },
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({
        message: "Cập nhật sản phẩm thành công",
        image,
      });
    }
  );
};

// DELETE
exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  Product.delete(id, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Xóa sản phẩm thành công" });
  });
};
