const db = require("./config/db");

db.query("ALTER TABLE threads ADD COLUMN is_human_needed BOOLEAN DEFAULT 0", (err, result) => {
  if (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("Column is_human_needed already exists.");
    } else {
      console.error("Error altering table:", err);
    }
  } else {
    console.log("Successfully added is_human_needed column.");
  }
  process.exit(0);
});
