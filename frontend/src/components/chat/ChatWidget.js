// frontend/src/components/chat/ChatWidget.js
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  getMyThread,
  getMyMessages,
  sendMyMessage,
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
  const role = localStorage.getItem("role"); // bạn đang lưu role ở login response
  const bottomRef = useRef(null);

  const socket = useMemo(() => {
    if (!token) return null;
    return io("http://localhost:5000", { transports: ["websocket"] });
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    return () => socket.disconnect();
  }, [socket]);

  useEffect(() => {
    if (!open || !token || role !== "CUSTOMER") return;

    (async () => {
      const t = await getMyThread();
      setThreadId(t.id);

      const data = await getMyMessages();
      setMessages(data.messages || []);

      const os = await getMyOrdersSummary();
      setOrders(Array.isArray(os) ? os : []);
    })();
  }, [open, token, role]);

  useEffect(() => {
    if (!socket || !threadId || !token) return;

    socket.emit("joinThread", { token, threadId });

    const onNew = (msg) => {
      if (msg.threadId !== threadId) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("newMessage", onNew);
    return () => socket.off("newMessage", onNew);
  }, [socket, threadId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!token || role !== "CUSTOMER") return null;

  const onSend = async () => {
    const m = text.trim();
    if (!m) return;

    setText("");
    await sendMyMessage(m, orderId ? Number(orderId) : null);
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((v) => !v)}>
        {open ? "×" : "💬"}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <div className="chat-title">Chat với shop</div>
              <div className="chat-sub">Gắn đơn hàng để shop xử lý nhanh</div>
            </div>
          </div>

          <div className="chat-tools">
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            >
              <option value="">— Chat chung (không gắn đơn) —</option>
              {orders.map((o) => (
                <option key={o.orderId} value={o.orderId}>
                  Đơn #{o.orderId} • {o.status} •{" "}
                  {Number(o.total).toLocaleString()}đ
                </option>
              ))}
            </select>
          </div>

          <div className="chat-body">
            {messages.map((m) => (
              <div
                key={m.id || `${m.senderRole}-${m.createdAt}-${Math.random()}`}
                className={`chat-msg ${
                  m.senderRole === "CUSTOMER" ? "me" : "other"
                } ${m.senderRole === "SYSTEM" ? "sys" : ""}`}
              >
                {m.orderId && (
                  <div className="chat-order-tag">Đơn #{m.orderId}</div>
                )}
                <div className="chat-bubble">{m.message}</div>
                <div className="chat-time">
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập tin nhắn..."
              onKeyDown={(e) => e.key === "Enter" && onSend()}
            />
            <button onClick={onSend}>Gửi</button>
          </div>
        </div>
      )}
    </>
  );
}
