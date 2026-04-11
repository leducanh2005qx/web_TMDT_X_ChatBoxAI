const db = require("./config/db");

const alterProductsQuery = `
  ALTER TABLE products 
  ADD COLUMN status ENUM('pending', 'active', 'hidden') DEFAULT 'pending',
  ADD COLUMN manager_id INT,
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN display_type VARCHAR(50)
`;

db.query(alterProductsQuery, (err) => {
  if (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("Columns already exist in products table.");
    } else {
      console.error("Migration failed:", err.message);
      process.exit(1);
    }
  } else {
    console.log("Products table schema updated successfully.");
  }
  process.exit(0);
});
