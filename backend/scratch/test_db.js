const db = require("../config/db");

db.query("SELECT 1", (err, result) => {
  if (err) {
    console.error("DB Connection Failed:", err.message);
  } else {
    console.log("DB Connection Success:", result);
  }
  process.exit();
});
