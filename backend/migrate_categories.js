const db = require("./config/db");

const alterTableQuery = "ALTER TABLE categories ADD COLUMN display_type ENUM('fashion', 'electronics', 'food', 'furniture', 'general') DEFAULT 'general'";

db.query(alterTableQuery, (err) => {
  if (err) {
    console.warn("Table might already have display_type or error occurred:", err.message);
  } else {
    console.log("Column display_type added to categories table.");
  }

  // Update existing categories
  const updates = [
    { id: 1, type: 'furniture' }, // Nội thất
    { id: 2, type: 'fashion' },   // Thời trang
    { id: 6, type: 'food' }      // Đồ ăn
  ];

  let completed = 0;
  updates.forEach(u => {
    db.query("UPDATE categories SET display_type = ? WHERE id = ?", [u.type, u.id], (err) => {
      if (err) console.error(`Failed to update category ${u.id}:`, err);
      completed++;
      if (completed === updates.length) {
        console.log("All categories updated.");
        process.exit(0);
      }
    });
  });
});
