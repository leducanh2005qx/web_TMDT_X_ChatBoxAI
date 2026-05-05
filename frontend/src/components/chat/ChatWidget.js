import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  getMyThread,
  getMyMessages,
  getMyOrdersSummary,
} from "../../services/chatApi";
import "./Chat.css";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [text, setText] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const bottomRef = useRef(null);

  // ✅ Khởi tạo Socket
  const socket = useMemo(() => {
    if (!token) return null;
    return io("http://localhost:5000", { transports: ["websocket"] });
  }, [token]);

  useEffect(() => {
    if (!open || !token || role !== "CUSTOMER") return;
    (async () => {
      const t = await getMyThread();
      setThreadId(t.id);
      const data = await getMyMessages(t.id);
      setMessages(Array.isArray(data) ? data : []);
      const os = await getMyOrdersSummary();
      setOrders(Array.isArray(os) ? os : []);
    })();
  }, [open, token, role]);

  // ✅ Fix lắng nghe Socket: Đảm bảo tên Event khớp với Backend
  useEffect(() => {
    if (!socket || !threadId || !token) return;

    socket.emit("join_thread", { threadId }); // ✅ Khớp với Backend join_thread

    const onNew = (msg) => {
      if (String(msg.threadId) === String(threadId)) {
        setMessages((prev) => {
          // Chống trùng lặp tin nhắn bằng ID thật
          if (prev.find((m) => m.id === msg.id)) return prev;
          // Nếu đây là tin nhắn do chính mình gửi (server echo), thay thế tin tạm
          const tempIndex = prev.findIndex(
            (m) => m.isTemp && m.message === msg.message && 
            (m.senderRole === msg.senderRole || m.sender_role === msg.sender_role)
          );
          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = { ...msg, isTemp: false, isError: false };
            return updated;
          }
          return [...prev, msg];
        });
      }
    };

    socket.on("receive_message", onNew);
    socket.on("newMessage", onNew);
    return () => {
      socket.off("receive_message", onNew);
      socket.off("newMessage", onNew);
    };
  }, [socket, threadId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // ✅ Tối ưu hoá UI: Hiển thị ngay lập tức (Optimistic UI)
  const onSend = () => {
    const m = text.trim();
    if (!m || !threadId || !currentUser.id) return;

    const tempId = "temp-" + Date.now();
    const payload = {
      id: tempId,
      threadId: threadId,
      senderRole: "CUSTOMER",
      sender_role: "CUSTOMER",
      senderId: currentUser.id,
      message: m,
      orderId: orderId ? Number(orderId) : null,
      isTemp: true,
    };

    // 1. Cập nhật UI ngay lập tức
    setMessages(prev => [...prev, payload]);

    // 2. Gửi qua socket với callback xác nhận
    socket.emit("send_message", payload, (response) => {
      if (response && response.success) {
        setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, isTemp: false } : msg));
      } else {
        setMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, isError: true } : msg));
      }
    });

    // Timeout nếu server sập không phản hồi
    setTimeout(() => {
      setMessages(prev => prev.map(msg => (msg.id === tempId && msg.isTemp) ? { ...msg, isError: true } : msg));
    }, 10000);

    setText("");
    setOrderId("");
  };



  if (!token || role !== "CUSTOMER") return null;

  return (
    <>
      <button
        className={`chat-fab ${open ? "active" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {open ? "×" : "💬"}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-title">👨‍💼 Hỗ trợ viên Tiger</div>
            <button className="close-btn" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="chat-tools">
            <label>GẮN ĐƠN HÀNG HỖ TRỢ:</label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            >
              <option value="">— Chat chung (không gắn đơn) —</option>
              {orders.map((o) => (
                <option key={o.orderId} value={o.orderId}>
                  {" "}
                  Đơn #{o.orderId} • {o.status}{" "}
                </option>
              ))}
            </select>
          </div>

          <div className="chat-body">
            {messages.map((m, i) => {
              const isSystem = m.senderRole === "SYSTEM" || m.sender_role === "SYSTEM";
              const isMe =
                m.senderRole === "CUSTOMER" ||
                m.senderRole === "USER" ||
                m.sender_role === "CUSTOMER" ||
                m.sender_role === "USER";

              return (
                <div
                  key={m.id || i}
                  className={`chat-msg ${isMe ? "me" : "other"} ${isSystem ? "sys" : ""}`}
                >
                  {m.orderId && (
                    <div className="chat-order-tag">Đơn #{m.orderId}</div>
                  )}
                  <div className="chat-bubble">
                    {isSystem && (
                      <div className="system-tag">🤖 TRỢ LÝ TIGER</div>
                    )}
                    {m.message}
                    {m.isError && <span title="Chưa gửi được do lỗi mạng hoặc server" style={{marginLeft: 8, fontSize: 14}}>⚠️</span>}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>



          <div className="chat-input-area">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập: 'Thanh toán', 'Voucher'..."
              onKeyDown={(e) => e.key === "Enter" && onSend()}
            />
            <button onClick={onSend}>GỬI</button>
          </div>
        </div>
      )}
    </>
  );
}
