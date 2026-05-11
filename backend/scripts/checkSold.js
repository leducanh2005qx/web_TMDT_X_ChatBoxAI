const db = require("./config/db");

db.query("SHOW COLUMNS FROM order_items", (e, r) => {
  console.log("Columns:", r.map(c => c.Field));

  const sql = `
    SELECT oi.product_id, SUM(oi.quantity) as total_sold
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    GROUP BY oi.product_id
    ORDER BY total_sold DESC
    LIMIT 10
  `;

  db.query(sql, (e2, r2) => {
    console.log("Top sold:", JSON.stringify(r2, null, 2));
    process.exit();
  });
});
