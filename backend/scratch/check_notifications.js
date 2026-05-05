const db = require("../config/db");

db.query("SHOW TABLES", (err, tables) => {
  if (err) {
    console.error("Error:", err);
    process.exit(1);
  }
  console.log("Tables:", tables);

  db.query("DESCRIBE notifications", (err, cols) => {
    if (err) {
      console.log("notifications table does not exist or error:", err.message);
    } else {
      console.log("notifications columns:", cols);
    }
    process.exit(0);
  });
});
