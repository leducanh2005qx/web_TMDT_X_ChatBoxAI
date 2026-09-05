-- ============================================================
--  Migration 009: AI Chat History
--  Lưu lịch sử hội thoại với Tiger AI theo từng user
-- ============================================================

-- Bảng phiên chat AI (mỗi user có 1 session duy nhất, tái sử dụng)
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ai_session_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng lưu từng tin nhắn trong session AI chat
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  session_id  INT NOT NULL,
  role        ENUM('USER', 'AI') NOT NULL,
  message     TEXT NOT NULL,
  voucher     VARCHAR(50) NULL COMMENT 'Mã voucher nếu AI phát ra',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE
);

-- Index để query nhanh theo session + thứ tự thời gian
CREATE INDEX idx_ai_messages_session ON ai_chat_messages(session_id, created_at);
