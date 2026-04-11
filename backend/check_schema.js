const db = require("./config/db");
db.query("DESCRIBE categories", (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
});
