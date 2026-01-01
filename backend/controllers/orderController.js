const db = require("../config/db");

exports.createOrder = (req, res) => {
  const { userId, cart, total } = req.body;

  db.query(
    "INSERT INTO orders (user_id, total) VALUES (?, ?)",
    [userId, total],
    (err, result) => {
      if (err) return res.status(500).json(err);

      const orderId = result.insertId;

      const items = cart.map((item) => [
        orderId,
        item.id,
        item.quantity,
        item.price,
      ]);

      db.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
        [items],
        (err2) => {
          if (err2) return res.status(500).json(err2);
          res.json({ message: "Đặt hàng thành công" });
        }
      );
    }
  );
};

exports.getOrdersByUser = (req, res) => {
  const userId = req.params.userId;

  db.query(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    }
  );
};
