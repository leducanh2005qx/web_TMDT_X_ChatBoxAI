import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAiSuggestion } from "../../../services/chatApi";
import "./ChatPanel.css";

const BACKEND_URL = "http://localhost:5000";
const socket = io(BACKEND_URL, { transports: ["websocket"] });

function ChatPanel({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const bottomRef = useRef(null);

  /* JOIN SOCKET ROOM */
  useEffect(() => {
    if (!user?.threadId) return;

    socket.emit("join_thread", user.threadId);

    const handleNewMessage = (msg) => {
      // Ép kiểu String để so sánh chính xác threadId
      if (String(msg.threadId) === String(user.threadId)) {
        setMessages((prev) => {
          // Chống trùng lặp tin nhắn
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("receive_message", handleNewMessage);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("receive_message", handleNewMessage);
      socket.off("newMessage", handleNewMessage);
    };
  }, [user]);

  /* LOAD MESSAGES */
  useEffect(() => {
    if (!user?.threadId) return;

    fetch(`${BACKEND_URL}/api/chat/admin/messages/${user.threadId}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch(() => setMessages([]));
  }, [user]);

  /* AUTO SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

    const currentText = text;
    setText(""); // Clear ngay lập tức để UX mượt hơn

    fetch(`${BACKEND_URL}/api/chat/admin/messages/${user.threadId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ content: currentText }),
    }).catch((err) => console.error("Send message error:", err));
  };

  const handleAiSuggest = async () => {
    if (!user?.threadId) return;
    setIsAiLoading(true);
    try {
      const data = await getAiSuggestion(user.threadId);
      if (data && data.suggestion) {
        setText(data.suggestion);
      } else {
        alert(data.message || "Không thể lấy gợi ý AI");
      }
    } catch (err) {
      alert("Lỗi kết nối AI: " + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="chat-panel-empty">
        <div className="empty-content">
          <span>💬</span>
          <p>Chọn một khách hàng để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel-premium">
      {/* Header Panel */}
      <div className="chat-header-premium">
        <div className="user-avatar-mini">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <div className="user-info-mini">
          <h4>{user.email}</h4>
          <span className="status-online">Đang trực tuyến</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages-premium">
        {messages.length === 0 ? (
          <div className="no-chat-msg">Hãy bắt đầu cuộc hội thoại</div>
        ) : (
          messages.map((m) => {
            // Xác định loại tin nhắn để render style tương ứng
            const isSystem = m.sender_role === "SYSTEM";
            const isAdmin = m.sender_role === "ADMIN";

            return (
              <div
                key={m.id}
                className={`msg-wrapper ${
                  isSystem
                    ? "system-side"
                    : isAdmin
                      ? "admin-side"
                      : "user-side"
                }`}
              >
                <div className="msg-bubble">
                  {isSystem && (
                    <span className="system-icon">🔔 Thông báo đơn hàng</span>
                  )}
                  <pre className="msg-text">{m.message}</pre>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-premium">
        <div style={{ paddingBottom: '8px', paddingLeft: '4px' }}>
          <button 
            type="button" 
            onClick={handleAiSuggest} 
            disabled={isAiLoading}
            style={{
              background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '20px', 
              padding: '6px 12px', 
              cursor: 'pointer', 
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isAiLoading ? 0.7 : 1
            }}
          >
            <span>✨</span> {isAiLoading ? "Đang suy nghĩ..." : "Gợi ý AI"}
          </button>
        </div>
        <div className="input-glass-box">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập nội dung phản hồi..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="btn-send-premium" onClick={sendMessage}>
            GỬI
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
