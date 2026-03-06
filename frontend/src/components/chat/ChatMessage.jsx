import React from "react";

function ChatMessage({ message, senderRole }) {
  const isMe = senderRole === "USER";
  const isSystem = senderRole === "SYSTEM";
  const isStaff = senderRole === "ADMIN";

  return (
    <div
      className={`chat-msg-wrapper ${isSystem ? "sys-row" : isMe ? "me-row" : "other-row"}`}
    >
      <div
        className={`chat-bubble ${isSystem ? "sys" : isMe ? "me" : "other"}`}
      >
        {/* Nhãn cho Trợ lý ảo / Thông báo hệ thống */}
        {isSystem && (
          <div className="system-tag">
            <span className="bot-icon">🤖</span> TRỢ LÝ TIGER
          </div>
        )}

        {/* Nhãn cho nhân viên hỗ trợ (Admin) */}
        {isStaff && (
          <div className="staff-tag">
            <span className="staff-icon">🛡️</span> Quản trị viên
          </div>
        )}

        {/* Nội dung tin nhắn xử lý xuống dòng và giữ định dạng */}
        <div
          className="chat-text"
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {message}
        </div>
      </div>

      {/* Hiển thị thời gian nhỏ bên dưới nếu cần (Tùy chọn) */}
      <div className="chat-meta">
        {isMe ? "Bạn" : isSystem ? "Tự động" : "Shop"}
      </div>
    </div>
  );
}

export default ChatMessage;
