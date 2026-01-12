const db = require("../config/db");

const Chat = {};

/* ================= THREAD ================= */
Chat.getOrCreateThreadByUserId = (userId, cb) => {
  const findSql = "SELECT * FROM threads WHERE user_id = ?";

  db.query(findSql, [userId], (err, rows) => {
    if (err) return cb(err);
    if (rows.length > 0) return cb(null, rows[0]);

    const insertSql = "INSERT INTO threads (user_id) VALUES (?)";
    db.query(insertSql, [userId], (err2, result) => {
      if (err2) return cb(err2);
      cb(null, { id: result.insertId, user_id: userId });
    });
  });
};

/* ================= MESSAGES ================= */
Chat.getMessages = (threadId, limit, cb) => {
  const sql = `
    SELECT *
    FROM chat_messages
    WHERE thread_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `;
  db.query(sql, [threadId, Number(limit)], cb);
};

Chat.createMessage = (data, cb) => {
  const sql = `
    INSERT INTO chat_messages
    (thread_id, sender_role, sender_id, receiver_id, message, order_id, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      data.threadId,
      data.senderRole,
      data.senderId,
      data.receiverId || null,
      data.message,
      data.orderId || null,
      data.type || "text",
    ],
    (err, result) => {
      if (err) return cb(err);
      cb(null, { id: result.insertId, ...data });
    }
  );
};

/* ================= ADMIN ================= */
Chat.listThreadsForAdmin = (cb) => {
  const sql = `
    SELECT 
      t.id,
      u.id AS userId,
      u.email
    FROM threads t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
  `;
  db.query(sql, cb);
};

/* ================= ORDERS ================= */
Chat.getOrdersSummaryByUserId = (userId, cb) => {
  const sql = `
    SELECT 
      id,
      total,
      status,
      created_at
    FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `;
  db.query(sql, [userId], cb);
};

module.exports = Chat;
