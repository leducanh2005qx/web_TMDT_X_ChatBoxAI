import React from "react";

function ChatMessage({ message, senderRole }) {
  const isMe = senderRole === "USER";
  const isSystem = senderRole === "SYSTEM";
  const isStaff = senderRole === "ADMIN";

  return (
    <div className={`chat-msg ${isSystem ? "sys" : isMe ? "me" : "other"}`}>
      <div className="chat-bubble">
        {/* Nhãn cho tin nhắn hệ thống (Đơn hàng) */}
        {isSystem && <div className="system-tag">🔔 THÔNG BÁO TỰ ĐỘNG</div>}

        {/* Nhãn cho nhân viên hỗ trợ nếu cần phân biệt */}
        {isStaff && (
          <div
            className="staff-tag"
            style={{ fontSize: "10px", opacity: 0.7, marginBottom: "4px" }}
          >
            Nhân viên hỗ trợ
          </div>
        )}

        {/* Nội dung tin nhắn: Dùng thẻ pre hoặc style white-space để giữ định dạng xuống hàng */}
        <div
          className="chat-text"
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {message}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
