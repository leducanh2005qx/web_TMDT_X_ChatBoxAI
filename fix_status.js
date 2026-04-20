const db = require('./backend/config/db');
db.query("UPDATE products SET status = 'active' WHERE status = 'pending'", (err) => {
  if (err) console.error(err);
  else console.log('Successfully updated pending products to active');
  process.exit(0);
});
