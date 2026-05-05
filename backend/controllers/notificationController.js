const db = require("../config/db");

// Tự động tạo bảng nếu chưa có
const createTableQuery = `
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;
db.query(createTableQuery, (err) => {
  if (err) console.error("Error creating notifications table:", err);
});

exports.getUnreadCount = (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT COUNT(*) as count 
    FROM notifications 
    WHERE user_id = ? 
      AND is_read = 0 
      AND type NOT IN ('admin_report', 'low_stock', 'revenue')
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Lỗi đếm thông báo:", err);
      return res.status(500).json({ message: "Lỗi máy chủ", count: 0 });
    }
    const count = results[0]?.count || 0;
    res.json({ count });
  });
};

exports.getUserNotifications = (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT * 
    FROM notifications 
    WHERE user_id = ? 
      AND type NOT IN ('admin_report', 'low_stock', 'revenue')
    ORDER BY created_at DESC 
    LIMIT 50
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Lỗi lấy thông báo:", err);
      return res.status(500).json({ message: "Lỗi máy chủ", notifications: [] });
    }
    res.json({ notifications: results });
  });
};

exports.markAsRead = (req, res) => {
  const userId = req.user.id;
  const query = `
    UPDATE notifications 
    SET is_read = 1 
    WHERE user_id = ? 
      AND is_read = 0 
      AND type NOT IN ('admin_report', 'low_stock', 'revenue')
  `;
  db.query(query, [userId], (err) => {
    if (err) {
      console.error("Lỗi cập nhật trạng thái thông báo:", err);
      return res.status(500).json({ message: "Lỗi máy chủ" });
    }
    res.json({ message: "Đã đánh dấu tất cả là đã đọc" });
  });
};

// Hàm Helper để sử dụng nội bộ (tạo thông báo & emit Socket)
exports.createNotification = (userId, title, message, type) => {
  const query = `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`;
  db.query(query, [userId, title, message, type], (err) => {
    if (err) {
      console.error("Lỗi tạo thông báo:", err);
      return;
    }
    
    // Đếm lại số lượng unread
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? 
        AND is_read = 0 
        AND type NOT IN ('admin_report', 'low_stock', 'revenue')
    `;
    db.query(countQuery, [userId], (errCount, results) => {
      if (!errCount && global.io) {
        const unreadCount = results[0]?.count || 0;
        // Bắn socket tới userId
        global.io.to(userId.toString()).emit("new_notification_count", unreadCount);
      }
    });
  });
};
