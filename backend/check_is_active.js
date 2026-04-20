const db = require('./config/db');
db.query("SHOW COLUMNS FROM users LIKE 'is_active'", (err, rows) => {
  if (err) { console.error('Error: ' + err.message); db.end(); return; }
  if (!rows.length) {
    console.log('is_active missing, adding...');
    db.query("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1", (e2) => {
      console.log(e2 ? 'Error: ' + e2.message : 'Added is_active column');
      db.end();
    });
  } else {
    console.log('is_active column exists OK');
    db.end();
  }
});
