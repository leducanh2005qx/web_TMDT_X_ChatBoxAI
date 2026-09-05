const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ecommerce'
});

const statements = [
  `CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ai_session_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role       ENUM('USER','AI') NOT NULL,
    message    TEXT NOT NULL,
    voucher    VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_chat_messages(session_id, created_at)`
];

db.connect((err) => {
  if (err) { console.error('❌ DB connect error:', err.message); process.exit(1); }
  console.log('✅ Connected to DB');

  let i = 0;
  function runNext() {
    if (i >= statements.length) {
      console.log('✅ Migration 009 completed successfully!');
      db.end();
      return;
    }
    db.query(statements[i], (err) => {
      if (err) {
        console.error(`❌ Statement ${i + 1} failed:`, err.message);
      } else {
        console.log(`✅ Statement ${i + 1} OK`);
      }
      i++;
      runNext();
    });
  }
  runNext();
});
