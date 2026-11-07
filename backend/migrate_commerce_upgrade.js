const mysql = require("mysql2/promise");

const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ecommerce",
};

async function columnExists(connection, table, column) {
  const [rows] = await connection.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function addColumn(connection, table, column, definition) {
  if (!(await columnExists(connection, table, column))) {
    await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`Added ${table}.${column}`);
  }
}

async function run() {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        receiver_name VARCHAR(150) NOT NULL,
        receiver_phone VARCHAR(30) NOT NULL,
        province VARCHAR(100) NOT NULL,
        district VARCHAR(100) NULL,
        ward VARCHAR(100) NULL,
        address_detail VARCHAR(500) NOT NULL,
        is_default TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_addresses_user (user_id),
        CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        old_status VARCHAR(50) NULL,
        new_status VARCHAR(50) NOT NULL,
        changed_by INT NULL,
        note VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_status_history_order (order_id),
        CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_status_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await addColumn(connection, "orders", "payment_status", "VARCHAR(30) NOT NULL DEFAULT 'unpaid'");
    await addColumn(connection, "orders", "cancel_reason", "TEXT NULL");
    await addColumn(connection, "orders", "completed_at", "DATETIME NULL");
    await addColumn(connection, "order_items", "variant_name", "VARCHAR(255) NULL");
    await addColumn(connection, "return_requests", "refund_amount", "DECIMAL(12,2) NULL");
    await addColumn(connection, "return_requests", "staff_note", "TEXT NULL");
    await addColumn(connection, "return_requests", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    await addColumn(connection, "return_requests", "stock_restored", "TINYINT(1) NOT NULL DEFAULT 0");

    console.log("Commerce upgrade migration completed.");
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error("Commerce upgrade migration failed:", error.message);
  process.exitCode = 1;
});
