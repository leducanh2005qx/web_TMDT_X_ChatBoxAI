const db = require("../config/db");

const migrate = async () => {
  try {
    console.log("Checking products table for embedding column...");
    const [columns] = await db.promise().query("SHOW COLUMNS FROM products LIKE 'embedding'");
    
    if (columns.length === 0) {
      console.log("Adding 'embedding' column to 'products' table...");
      await db.promise().query("ALTER TABLE products ADD COLUMN embedding LONGTEXT NULL");
      console.log("Success: Column 'embedding' added.");
    } else {
      console.log("Column 'embedding' already exists.");
    }
  } catch (error) {
    console.error("Migration Error:", error.message);
  } finally {
    process.exit();
  }
};

migrate();
