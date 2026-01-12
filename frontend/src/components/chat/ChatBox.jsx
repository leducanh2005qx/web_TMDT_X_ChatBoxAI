import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import ChatMessage from "./ChatMessage";
import "./Chat.css";

const socket = io("http://localhost:5000");

function ChatBox({ onClose }) {
  const userId = Number(localStorage.getItem("userId")); // 👈 lưu khi login
  const role = localStorage.getItem("role");
  const adminId = 1; // 👈 ID admin (cố định)
  const receiverId = role === "ADMIN" ? userId : adminId;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit("join", userId);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receiveMessage");
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

    const msg = {
      senderId: userId,
      receiverId,
      message: text,
    };

    socket.emit("sendMessage", msg);
    setMessages((prev) => [...prev, msg]);
    setText("");
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <span>💬 Chat với Shop</span>
        <button onClick={onClose}>✖</button>
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <ChatMessage
            key={i}
            message={m.message}
            isMe={m.senderId === userId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
}

export default ChatBox;
