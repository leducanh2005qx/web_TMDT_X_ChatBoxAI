const db = require('./config/db');

db.query(
  "ALTER TABLE vouchers MODIFY COLUMN source ENUM('SYSTEM','MANUAL','WELCOME','BIRTHDAY') DEFAULT 'MANUAL'",
  (err) => {
    if (err) console.error('Migration error:', err.message);
    else console.log('✅ Voucher source enum updated: SYSTEM, MANUAL, WELCOME, BIRTHDAY');
    process.exit(0);
  }
);
