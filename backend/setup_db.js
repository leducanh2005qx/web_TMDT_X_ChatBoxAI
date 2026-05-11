const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({host:'localhost',user:'root',password:'',database:'ecommerce'});
  await c.query(`CREATE TABLE IF NOT EXISTS return_requests (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT NOT NULL, 
    order_id INT NOT NULL, 
    reason TEXT NOT NULL, 
    status VARCHAR(50) DEFAULT 'pending', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (user_id) REFERENCES users(id), 
    FOREIGN KEY (order_id) REFERENCES orders(id)
  )`);
  console.log('Created');
  await c.end();
}
run();
