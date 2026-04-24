const db = require('./config/db');

// Simulate an order status update by an admin (user_id = 1)
const orderId = 15; // Assuming order 15 exists based on previous logs
const status = 'shipping';
const userId = 1;
const logAction = `Đã cập nhật trạng thái đơn hàng #${orderId} thành: ${status.toUpperCase()}`;

db.query(
  "INSERT INTO user_activity_logs (user_id, action, target_id) VALUES (?, ?, ?)",
  [userId, logAction, orderId],
  (err, result) => {
    if (err) {
      console.error("Lỗi test log:", err.message);
    } else {
      console.log("Đã giả lập log thành công, ID:", result.insertId);
    }
    process.exit(0);
  }
);
