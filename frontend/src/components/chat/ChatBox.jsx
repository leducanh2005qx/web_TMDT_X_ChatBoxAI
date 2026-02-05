import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import ChatMessage from "./ChatMessage";
import "./Chat.css";

const socket = io("http://localhost:5000");

function ChatBox({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [threadId, setThreadId] = useState(null);
  const messagesEndRef = useRef(null);

  // 1. Lấy thông tin Thread của riêng khách hàng này khi mở Chat
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

  // 2. Load lịch sử tin nhắn (Bao gồm tin nhắn SYSTEM đơn hàng cũ)
  const loadOldMessages = (id) => {
    fetch(`http://localhost:5000/api/chat/messages/${id}`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      });
  };

  // 3. Socket: Join Thread và lắng nghe tin nhắn mới Real-time
  useEffect(() => {
    if (!threadId) return;

    // Join vào phòng chat riêng để nhận thông báo đơn hàng
    socket.emit("join_thread", threadId);

    const handleNewMessage = (msg) => {
      // Chỉ nhận tin nhắn nếu đúng mã thread
      if (String(msg.threadId) === String(threadId)) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [threadId]);

  // Tự động cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !threadId) return;

    const currentText = text;
    setText("");

    fetch(`http://localhost:5000/api/chat/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ threadId, content: currentText }),
    }).then(() => {
      // Local append để giao diện mượt mà hơn
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender_role: "USER",
          message: currentText,
          threadId: threadId,
        },
      ]);
    });
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">
          <span>🐯</span> Tiger Support
        </div>
        <div className="chat-sub">Chúng tôi thường phản hồi ngay lập tức</div>
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
      </div>

      <div className="chat-body">
        {messages.length === 0 ? (
          <div className="no-chat-msg">
            Bắt đầu cuộc trò chuyện với chúng tôi...
          </div>
        ) : (
          messages.map((m, i) => (
            <ChatMessage
              key={m.id || i}
              message={m.message}
              senderRole={m.sender_role} // Truyền role để xử lý hiển thị SYSTEM
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập nội dung cần hỗ trợ..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>GỬI</button>
      </div>
    </div>
  );
}

export default ChatBox;
