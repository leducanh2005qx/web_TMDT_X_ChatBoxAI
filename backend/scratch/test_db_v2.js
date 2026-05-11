require("dotenv").config();
const db = require("../config/db");

console.log("Testing connection with:", {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  database: process.env.DB_NAME || "ecommerce"
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("DB Connection Failed Detail:", err);
  } else {
    console.log("DB Connection Success!");
    connection.release();
  }
  process.exit();
});
