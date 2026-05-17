const db = require('../config/db');

db.query(
  `SELECT p.id, p.name AS p_name, p.image AS p_image, 
          oi.order_id, oi.product_name AS oi_name, oi.product_image AS oi_image
   FROM products p
   JOIN order_items oi ON p.id = oi.product_id
   WHERE p.id IN (8, 9) LIMIT 5`,
  (err, rows) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log("Comparison result:", rows);
    process.exit(0);
  }
);
