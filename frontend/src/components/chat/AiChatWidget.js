import { useRef, useState, useEffect } from "react";
import "./Chat.css"; // Reuse existing chat styles

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Initial greeting
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: "sys-1",
        senderRole: "SYSTEM",
        message: "Dạ Tiger Shop xin chào ạ! Sếp cần em tư vấn sản phẩm gì không? 🐯",
      }]);
    }
  }, [open, messages.length]);

  const onSend = async () => {
    const m = text.trim();
    if (!m) return;

    const userMsg = {
      id: "u-" + Date.now(),
      senderRole: "CUSTOMER",
      message: m,
    };

    setMessages(prev => [...prev, userMsg]);
    setText("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat/ai/talk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: m })
      });
      const data = await res.json();
      
      if (data.success && data.reply) {
        setMessages(prev => [...prev, {
          id: "sys-" + Date.now(),
          senderRole: "SYSTEM",
          message: data.reply
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: "sys-" + Date.now(),
          senderRole: "SYSTEM",
          message: data.error || "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!"
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: "sys-" + Date.now(),
        senderRole: "SYSTEM",
        message: "Tiger AI đang bảo trì, sếp hãy nhắn cho nhân viên ở phía dưới nhé!"
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!token || role !== "CUSTOMER") return null;

  return (
    <>
      <button
        className={`chat-fab ai-fab ${open ? "active" : ""}`}
        onClick={() => setOpen(!open)}
        style={{ bottom: "100px", backgroundColor: "#ffb020" }} // Đặt AI cao hơn
      >
        {open ? "×" : "🤖"}
      </button>

      {open && (
        <div className="chat-panel" style={{ bottom: "100px", border: "2px solid #ffb020" }}>
          <div className="chat-header" style={{ background: "linear-gradient(to right, #ffb020, #f87d09)" }}>
            <div className="chat-title">🤖 Tiger AI Tư Vấn</div>
            <button className="close-btn" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="chat-body custom-scrollbar">
            {messages.map((m, i) => {
              const isSystem = m.senderRole === "SYSTEM";
              const isMe = m.senderRole === "CUSTOMER";

              return (
                <div key={m.id || i} className={`chat-msg ${isMe ? "me" : "other"} ${isSystem ? "sys" : ""}`}>
                  <div className="chat-bubble">
                    {isSystem && <div className="system-tag">🤖 TRỢ LÝ TIGER</div>}
                    {m.message}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="chat-msg sys">
                <div className="chat-bubble">
                  <div className="system-tag">🤖 TRỢ LÝ TIGER</div>
                  Đang nghĩ... 🐯
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-area">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Hỏi AI Tiger: 'Giá quần bò', 'Chính sách'..."
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              disabled={loading}
            />
            <button onClick={onSend} disabled={loading || !text.trim()}>GỬI</button>
          </div>
        </div>
      )}
    </>
  );
}
