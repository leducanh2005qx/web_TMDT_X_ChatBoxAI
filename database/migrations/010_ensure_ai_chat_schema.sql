-- ============================================================
--  Migration 010: Ensure AI Chat Schema is Complete
--  Đảm bảo ai_chat_messages có đủ index và metadata column
-- ============================================================

-- Thêm cột metadata nếu chưa có (lưu context bổ sung như voucher, intent)
ALTER TABLE ai_chat_messages
  ADD COLUMN IF NOT EXISTS metadata JSON NULL COMMENT 'Context bổ sung: intent, voucher, v.v.' AFTER voucher;

-- Index để query nhanh 10 tin nhắn gần nhất theo session
-- (Nếu đã có thì bỏ qua lỗi)
CREATE INDEX IF NOT EXISTS idx_ai_msg_session_time
  ON ai_chat_messages(session_id, created_at DESC);
