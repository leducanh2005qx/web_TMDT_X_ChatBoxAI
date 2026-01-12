const db = require("../config/db");

const Chat = {};

/* =====================================================
   THREADS
===================================================== */

// 🔥 ADMIN SIDEBAR – LIST THREADS
Chat.listThreadsForAdmin = (cb) => {
  const sql = `
    SELECT 
      t.id AS threadId,
      u.id AS userId,
      u.email,
      MAX(m.created_at) AS lastMessageAt
    FROM threads t
    JOIN users u ON t.user_id = u.id
    LEFT JOIN chat_messages m ON m.thread_id = t.id
    GROUP BY t.id, u.id, u.email
    ORDER BY lastMessageAt DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
};

// 🔥 AUTO CREATE THREAD FOR USER
Chat.getOrCreateThreadByUserId = (userId, cb) => {
  db.query("SELECT * FROM threads WHERE user_id = ?", [userId], (err, rows) => {
    if (err) return cb(err);

    if (rows.length > 0) {
      return cb(null, rows[0]);
    }

    db.query(
      "INSERT INTO threads (user_id) VALUES (?)",
      [userId],
      (err2, result) => {
        if (err2) return cb(err2);
        cb(null, {
          id: result.insertId,
          user_id: userId,
        });
      }
    );
  });
};

/* =====================================================
   MESSAGES
===================================================== */

Chat.getMessages = (threadId, limit = 100, cb) => {
  const sql = `
    SELECT *
    FROM chat_messages
    WHERE thread_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `;

  db.query(sql, [threadId, limit], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
};

Chat.createMessage = (data, cb) => {
  const {
    threadId,
    senderRole,
    senderId,
    receiverId = null,
    message,
    orderId = null,
    type = "text",
  } = data;

  const sql = `
    INSERT INTO chat_messages
    (thread_id, sender_role, sender_id, receiver_id, message, order_id, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [threadId, senderRole, senderId, receiverId, message, orderId, type],
    (err, result) => {
      if (err) return cb(err);
      cb(null, { id: result.insertId });
    }
  );
};

/* =====================================================
   ORDERS (FOR CHAT PANEL)
===================================================== */

Chat.getOrdersSummaryByUserId = (userId, cb) => {
  const sql = `
    SELECT id, total, status, created_at
    FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows);
  });
};

module.exports = Chat;
