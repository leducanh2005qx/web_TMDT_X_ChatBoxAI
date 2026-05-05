const { createNotification } = require("../controllers/notificationController");
const db = require("../config/db");

// Tìm 1 user để test (VD: user đầu tiên có vai trò CUSTOMER)
db.query("SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE role_name = 'CUSTOMER') LIMIT 1", (err, users) => {
  if (err || users.length === 0) {
    console.log("Không tìm thấy user nào để test.");
    process.exit(0);
  }
  
  const testUserId = users[0].id;
  console.log(`Đang tạo thông báo test cho User ID: ${testUserId}...`);
  
  // Hàm createNotification cần global.io, vì script chạy rời rạc không có global.io,
  // chúng ta sẽ import giả lập hoặc tự query thẳng để test DB.
  const query = `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`;
  db.query(query, [testUserId, "Đơn hàng đã giao", "Đơn hàng #123 của bạn đã được giao thành công.", "order"], (err2) => {
    if (err2) console.error("Lỗi:", err2);
    else console.log("✅ Đã tạo thành công! Hãy vào giao diện Khách hàng (f5 nếu cần) để xem chấm đỏ.");
    process.exit(0);
  });
});
