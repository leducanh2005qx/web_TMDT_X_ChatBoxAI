import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function ChatPanel({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  /* JOIN SOCKET ROOM */
  useEffect(() => {
    if (!user?.threadId) return;

    socket.emit("join_thread", user.threadId);

    socket.on("new_message", (msg) => {
      if (msg.threadId === user.threadId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("new_message");
    };
  }, [user]);

  /* LOAD MESSAGES */
  useEffect(() => {
    if (!user?.threadId) return;

    fetch(`http://localhost:5000/api/chat/admin/messages/${user.threadId}`, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      });
  }, [user]);

  /* AUTO SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;

    fetch(`http://localhost:5000/api/chat/admin/messages/${user.threadId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ content: text }),
    }).then(() => {
      // ✅ APPEND NGAY (KHÔNG ĐỢI SOCKET)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender_role: "ADMIN",
          message: text,
          threadId: user.threadId,
        },
      ]);
      setText("");
    });
  };

  if (!user) {
    return <div className="chat-panel">👈 Chọn khách để chat</div>;
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">
        💬 Chat với <strong>{user.email}</strong>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p style={{ color: "#6b7280" }}>Chưa có tin nhắn</p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-message ${
              m.sender_role === "ADMIN" ? "admin" : "user"
            }`}
          >
            {m.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập tin nhắn..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
}

export default ChatPanel;
