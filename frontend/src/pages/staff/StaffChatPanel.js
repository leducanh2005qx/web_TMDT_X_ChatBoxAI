import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { 
  ArrowLeft, Send, Image as ImageIcon, Sparkles, 
  User, Loader2, Bot
} from 'lucide-react';
import './SupportCenter.css';

const BACKEND_URL = 'http://localhost:5000';

export default function StaffChatPanel({ thread, onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiMuted, setAiMuted] = useState(thread.is_ai_muted === 1);
  const bottomRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const socket = useMemo(() => {
    return io(BACKEND_URL, { transports: ["websocket"] });
  }, []);

  useEffect(() => {
    socket.emit("join_thread", { threadId: thread.threadId });
    
    // Nếu thread đang ở trạng thái 'staff_needed', tự động nhận diện nhân viên đã vào
    if (thread.status === 'staff_needed') {
      socket.emit("staff_join", { threadId: thread.threadId, staffId: currentUser.id });
    }

    const onNew = (msg) => {
      if (String(msg.threadId) === String(thread.threadId)) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Mỗi khi có tin nhắn mới của khách, tự động lấy gợi ý mới
        if (msg.senderRole === "CUSTOMER" || msg.sender_role === "CUSTOMER") {
          fetchSuggestions();
        }
      }
    };

    socket.on("receive_message", onNew);
    socket.on("newMessage", onNew);
    socket.on("thread_status_updated", (data) => {
      if (String(data.threadId) === String(thread.threadId) && typeof data.isAiMuted !== 'undefined') {
        setAiMuted(data.isAiMuted === 1);
      }
    });

    fetchMessages();
    fetchSuggestions();

    return () => {
      socket.off("receive_message", onNew);
      socket.off("newMessage", onNew);
      socket.off("thread_status_updated");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.threadId, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/admin/threads/${thread.threadId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/admin/threads/${thread.threadId}/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSend = (textMsg = null) => {
    const msg = textMsg || inputText.trim();
    if (!msg) return;

    const payload = {
      threadId: thread.threadId,
      senderRole: "ADMIN", // Dùng ADMIN để khớp middleware backend
      senderId: currentUser.id,
      message: msg,
      type: "text"
    };

    socket.emit("send_message", payload);
    if (!textMsg) setInputText("");
    // Ẩn suggestions sau khi đã gửi
    setSuggestions([]);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      if (data.imageUrl) {
        // Gửi tin nhắn chứa ảnh
        const payload = {
          threadId: thread.threadId,
          senderRole: "ADMIN",
          senderId: currentUser.id,
          message: "[Hình ảnh sản phẩm]",
          image_url: data.imageUrl,
          type: "image"
        };
        socket.emit("send_message", payload);
      }
    } catch (err) {
       alert("Lỗi upload ảnh");
    } finally {
      setUploading(false);
    }
  };

  const toggleAI = () => {
    const nextState = !aiMuted;
    socket.emit("staff_toggle_ai", { threadId: thread.threadId, isAiMuted: nextState });
    setAiMuted(nextState);
  };

  return (
    <div className="staff-chat-panel">
      <div className="chat-nav">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="user-header">
          <div className="avatar-mini"><User size={16} /></div>
          <div className="info">
            <div className="name">{thread.email.split('@')[0]}</div>
            <div className="status">{aiMuted ? "Sếp đang trực tiếp hỗ trợ" : "Tiger AI đang trả lời tự động"}</div>
          </div>
        </div>
        <div className="chat-nav-actions">
          <button 
            className={`btn-toggle-ai ${!aiMuted ? 'active' : ''}`} 
            onClick={toggleAI}
            title={aiMuted ? "Bật AI phản hồi" : "Tắt AI phản hồi"}
          >
            <Bot size={18} />
            <span>{aiMuted ? "AI Off" : "AI On"}</span>
          </button>
        </div>
      </div>

      <div className="messages-area custom-scrollbar">
        {messages.map((m, idx) => {
          const isMe = m.senderRole === "ADMIN" || m.sender_role === "ADMIN";
          const isSystem = m.senderRole === "SYSTEM" || m.sender_role === "SYSTEM";

          if (isSystem) return <div key={idx} className="msg-system"><span>{m.message}</span></div>;
          
          return (
            <div key={idx} className={`msg-row ${isMe ? 'me' : 'other'}`}>
              <div className="bubble">
                {m.type === 'image' || m.image_url ? (
                  <img src={`${BACKEND_URL}/uploads/${m.image_url}`} alt="sent" className="chat-img" />
                ) : (
                  m.message
                )}
                <div className="time">{new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="input-control-area">
        {/* Quick Suggestions UI */}
        <div className="ai-suggestions-bar">
          <div className="suggestion-label"><Sparkles size={14} /> Gợi ý từ Tiger AI:</div>
          <div className="suggestion-chips">
            {loadingSuggestions ? (
              <Loader2 className="animate-spin text-muted" size={16} />
            ) : (
              suggestions.map((s, i) => (
                <button key={i} className="chip" onClick={() => handleSend(s)}>{s}</button>
              ))
            )}
          </div>
        </div>

        <div className="input-row">
          <label className="btn-icon" title="Gửi ảnh">
            <ImageIcon size={22} />
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </label>
          
          <button 
            className="btn-icon btn-ai-assist" 
            title="Nhờ Tiger AI soạn phản hồi"
            onClick={() => {
               if (suggestions.length > 0) {
                 setInputText(suggestions[0]);
               } else {
                 fetchSuggestions();
               }
            }}
            disabled={loadingSuggestions}
          >
            <Sparkles size={22} className={loadingSuggestions ? "animate-pulse" : ""} />
          </button>

          <input 
            type="text" 
            placeholder="Nhập tin nhắn..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn-send" onClick={() => handleSend()} disabled={!inputText.trim()}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
