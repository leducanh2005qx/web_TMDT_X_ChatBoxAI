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

  // ✅ Fix lắng nghe Socket: Đảm bảo tên Event khớp với Backend (send_message / newMessage)
  useEffect(() => {
    if (!socket || !threadId || !token) return;

    socket.emit("joinThread", { threadId }); // Khớp với Backend joinThread

    const onNew = (msg) => {
      if (String(msg.threadId) === String(threadId)) {
        setMessages((prev) => {
          // Chống trùng lặp tin nhắn
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("newMessage", onNew);
    return () => socket.off("newMessage", onNew);
  }, [socket, threadId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // ✅ Fix hàm gửi tin nhắn: Gửi qua Socket để kích hoạt AI trả lời tự động ngay lập tức
  const onSend = () => {
    const m = text.trim();
    if (!m || !threadId || !currentUser.id) return;

    const payload = {
      threadId: threadId,
      senderRole: "CUSTOMER",
      senderId: currentUser.id, // ID người dùng thực tế
      message: m,
      orderId: orderId ? Number(orderId) : null,
    };

    // Gửi qua socket thay vì gọi API POST để AI ở Backend nhận diện được ngay
    socket.emit("send_message", payload);

    setText("");
    setOrderId("");
  };

  const onRequestStaff = () => {
    if (!threadId || !socket) return;
    socket.emit("request_staff", { threadId });
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
            <div className="chat-title">🐯 Trợ lý Tiger Shop</div>
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
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="chat-actions-bar">
            <button className="btn-request-staff" onClick={onRequestStaff}>
              🙋‍♂️ Chat với nhân viên
            </button>
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
