const db = require('../config/db');

async function fixSchema() {
  try {
    const [columns] = await db.promise().query("SHOW COLUMNS FROM order_items");
    const columnNames = columns.map(c => c.Field);
    
    if (!columnNames.includes('product_name')) {
      console.log("Adding product_name to order_items...");
      await db.promise().query("ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255)");
    }
    
    if (!columnNames.includes('product_image')) {
      console.log("Adding product_image to order_items...");
      await db.promise().query("ALTER TABLE order_items ADD COLUMN product_image VARCHAR(255)");
    }
    
    console.log("Schema fix completed.");
    process.exit(0);
  } catch (err) {
    console.error("Error fixing schema:", err);
    process.exit(1);
  }
}

fixSchema();
