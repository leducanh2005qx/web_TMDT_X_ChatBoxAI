const db = require('../config/db');

db.query(
  "SELECT id, product_id FROM order_items WHERE product_image LIKE '%loremflickr.com%'",
  (err, rows) => {
    if (err) {
      console.error("Error querying order items:", err);
      process.exit(1);
    }
    if (rows.length === 0) {
      console.log("No broken order item images to update.");
      process.exit(0);
    }

    let completed = 0;
    rows.forEach((row) => {
      const uniquePicsum = `https://picsum.photos/id/${(row.id * 17) % 1000}/400/400`;
      db.query(
        "UPDATE order_items SET product_image = ? WHERE id = ?",
        [uniquePicsum, row.id],
        (err2) => {
          if (err2) {
            console.error(`Error updating row ${row.id}:`, err2);
          }
          completed++;
          if (completed === rows.length) {
            console.log(`Successfully migrated ${rows.length} order items!`);
            process.exit(0);
          }
        }
      );
    });
  }
);
