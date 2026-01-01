const Product = require("../models/Product");

exports.getAllProducts = (req, res) => {
  Product.getAll((err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.createProduct = (req, res) => {
  const { name, price, image } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Thiếu thông tin sản phẩm" });
  }

  Product.create({ name, price, image }, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Thêm sản phẩm thành công" });
  });
};

exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  Product.delete(id, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Xóa sản phẩm thành công" });
  });
};
