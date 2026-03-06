import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import ChatMessage from "./ChatMessage";
import "./Chat.css";

// Kết nối Socket đến Server Backend (Localhost:5000)
const socket = io("http://localhost:5000");

function ChatBox({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [threadId, setThreadId] = useState(null);
  const messagesEndRef = useRef(null);

  // 1. Lấy thông tin Thread của khách hàng từ Database
  useEffect(() => {
    fetch(`http://localhost:5000/api/chat/my-thread`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setThreadId(data.id);
          loadOldMessages(data.id);
        }
      })
      .catch((err) => console.error("Lỗi lấy thread:", err));
  }, []);

  // 2. Tải lịch sử tin nhắn cũ
  const loadOldMessages = (id) => {
    fetch(`http://localhost:5000/api/chat/messages/${id}`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      });
  };

  // 3. Quản lý Socket: Lắng nghe tin nhắn từ Admin và Chatbot
  useEffect(() => {
    if (!threadId) return;

    socket.emit("join_thread", threadId);

    const handleNewMessage = (msg) => {
      // Chỉ cập nhật nếu tin nhắn không phải do chính USER gửi (đã append local)
      // hoặc là tin nhắn từ SYSTEM/ADMIN
      setMessages((prev) => {
        const isDuplicate = prev.find((m) => m.id === msg.id);
        if (isDuplicate) return prev;
        return [...prev, msg];
      });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [threadId]);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Hàm gửi tin nhắn
  const sendMessage = () => {
    if (!text.trim() || !threadId) return;

    const currentText = text;
    setText("");

    // Gửi qua Socket để Backend xử lý lưu DB và kích hoạt Chatbot
    socket.emit("send_message", {
      threadId: threadId,
      senderRole: "USER",
      senderId: JSON.parse(atob(localStorage.getItem("token").split(".")[1]))
        .id, // Lấy ID từ JWT
      message: currentText,
    });

    // Lưu tạm vào state để giao diện phản hồi ngay lập tức
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender_role: "USER",
        message: currentText,
        threadId: threadId,
      },
    ]);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">
          <span>🐯</span> Trợ lý Tiger Shop
        </div>
        <div className="chat-sub">Phản hồi tự động & Hỗ trợ 24/7</div>
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
      </div>

      <div className="chat-body">
        {messages.length === 0 ? (
          <div className="no-chat-msg">🐯 "Chào bạn! Tôi có thể giúp gì?"</div>
        ) : (
          messages.map((m, i) => (
            <ChatMessage
              key={m.id || i}
              message={m.message}
              senderRole={m.sender_role || m.senderRole}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Hỏi Tiger về: Vận chuyển, Thanh toán..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="send-btn-tiger" onClick={sendMessage}>
          GỬI
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
