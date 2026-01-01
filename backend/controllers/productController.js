const Product = require("../models/Product");
const db = require("../config/db");

// ================= GET ALL =================
exports.getAllProducts = (req, res) => {
  Product.getAll((err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

// ================= GET BY ID (QUAN TRỌNG) =================
exports.getProductById = (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM products WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // trả về đầy đủ: name, price, image, description, stock
    res.json(result[0]);
  });
};

// ================= CREATE =================
exports.createProduct = (req, res) => {
  const { name, price, description, stock } = req.body;
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

// ================= UPDATE =================
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price, description, stock } = req.body;
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

// ================= DELETE =================
exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  Product.delete(id, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Xóa sản phẩm thành công" });
  });
};
