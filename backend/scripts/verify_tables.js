const mysql = require('mysql2');
const db = mysql.createConnection({ host:'localhost', user:'root', password:'', database:'ecommerce' });
db.query('SHOW TABLES LIKE "ai_chat%"', (err, rows) => {
  if (err) { console.error(err); db.end(); return; }
  console.log('✅ AI Chat Tables:', rows.map(r => Object.values(r)[0]));
  db.end();
});
