import { useState } from "react";
import ChatBox from "./ChatBox";
import "./Chat.css";

function ChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Nút bấm nổi (Floating Action Button) đồng bộ Dashboard Tiger Shop */}
      <button
        className={`chat-fab ${open ? "active" : ""}`}
        onClick={() => setOpen(!open)}
        title={open ? "Đóng chat" : "Chat với Trợ lý Tiger"}
      >
        {open ? (
          <span className="fab-icon">✖</span>
        ) : (
          <div className="fab-content">
            <span className="fab-icon">💬</span>
            <span className="fab-badge">1</span>{" "}
            {/* Chỉ báo có 1 trợ lý online */}
          </div>
        )}
      </button>

      {/* Hiển thị khung ChatBox khi trạng thái open là true */}
      {open && (
        <div className="chat-box-container-premium">
          <ChatBox onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

export default ChatButton;
