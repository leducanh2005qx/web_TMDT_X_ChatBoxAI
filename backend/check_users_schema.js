const db = require('./config/db');
db.query("DESCRIBE users", (err, result) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(result, null, 2));
  process.exit(0);
});
