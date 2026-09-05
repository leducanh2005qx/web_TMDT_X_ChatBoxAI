import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { io } from "socket.io-client";
import { Send, User, X, MessageCircle, Sparkles, ChevronLeft, Trash2 } from "lucide-react";
import { getMyThread, getMyMessages, getMyOrdersSummary } from "../../services/chatApi";
import "./Chat.css";

// ============================================================
//  🔧 BUG FIX #1: useStreamingEffect
//  Nguyên nhân lỗi nuốt ký tự đầu:
//  - Khi speed=0: setInterval(fn, 0) chạy async nên frame đầu tiên
//    có thể bị miss trước khi closure capture được i=0 đúng lúc.
//  - Fix: speed=0 → trả ngay full text, không dùng interval.
//  - Fix thêm: với speed>0, lấy char TRƯỚC rồi mới tăng i,
//    đảm bảo charAt(0) luôn được append ở tick đầu tiên.
// ============================================================
function useStreamingEffect(text, speed = 20) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      setIsDone(true);
      return;
    }

    // Không cần hiệu ứng stream → hiển thị ngay toàn bộ
    if (speed === 0) {
      setDisplayedText(text);
      setIsDone(true);
      return;
    }

    // Có hiệu ứng stream: bắt đầu từ index 0, append từng ký tự
    let i = 0;
    setDisplayedText("");
    setIsDone(false);

    const timer = setInterval(() => {
      if (i >= text.length) {
        clearInterval(timer);
        setIsDone(true);
        return;
      }
      const char = text.charAt(i); // lấy char TRƯỚC
      i++;                          // rồi mới tăng i
      setDisplayedText((prev) => prev + char);
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayedText, isDone };
}

// Sub-component cho từng tin nhắn AI – chỉ tin cuối mới có hiệu ứng gõ chữ
function AiMessage({ message, isLast }) {
  const { displayedText, isDone } = useStreamingEffect(message ?? "", isLast ? 15 : 0);
  return <>{displayedText}{!isDone && isLast && "..."}</>;
}

// ============================================================
//  🔧 BUG FIX #2: isValidVoucher helper
//  Gemini đôi khi trả về chuỗi "null" thay vì null thực sự.
//  Hàm này lọc sạch mọi giá trị không hợp lệ.
// ============================================================
function isValidVoucher(v) {
  return (
    v != null &&
    v !== "null" &&
    v !== "undefined" &&
    String(v).trim().length > 0
  );
}

// ============================================================
//  MAIN COMPONENT
// ============================================================
export default function UnifiedChatWidget() {
  const [open, setOpen] = useState(false);
  const [chatMode, setChatMode] = useState(null); // null | 'ai' | 'staff'

  // AI State
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistoryLoaded, setAiHistoryLoaded] = useState(false); // tránh load lại

  // Staff State
  const [staffThreadId, setStaffThreadId] = useState(null);
  const [staffMessages, setStaffMessages] = useState([]);
  const [staffInput, setStaffInput] = useState("");
  const [staffOrders, setStaffOrders] = useState([]);
  const [staffSelectedOrderId, setStaffSelectedOrderId] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const aiBottomRef = useRef(null);
  const staffBottomRef = useRef(null);

  // Socket – chỉ tạo khi đã mở và có token
  const socket = useMemo(() => {
    if (!token || !open) return null;
    return io("http://localhost:5000", { transports: ["websocket"] });
  }, [token, open]);

  // Reset chatMode khi đóng panel
  useEffect(() => {
    if (!open) setChatMode(null);
  }, [open]);

  // ── Load lịch sử AI chat từ DB (chỉ load 1 lần duy nhất) ──
  useEffect(() => {
    if (!open || !token || aiHistoryLoaded) return;

    fetch("http://localhost:5000/api/chat/ai/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((history) => {
        setAiHistoryLoaded(true);
        if (Array.isArray(history) && history.length > 0) {
          // Map DB rows → định dạng aiMessages
          setAiMessages(
            history.map((m) => ({
              id: m.id,
              role: m.role,      // "USER" | "AI"
              text: m.message,   // field từ DB là message
              voucher: m.voucher,
            }))
          );
        } else {
          // Chưa có lịch sử → hiện lời chào
          setAiMessages([
            {
              id: "ai-greet",
              role: "AI",
              text: "Dạ Tiger Shop xin chào sếp! Em là Tiger AI, sếp cần em tư vấn sản phẩm gì không? 🐯",
            },
          ]);
        }
      })
      .catch(() => {
        setAiHistoryLoaded(true);
        // Lỗi mạng → vẫn hiện lời chào mặc định
        setAiMessages([
          {
            id: "ai-greet",
            role: "AI",
            text: "Dạ Tiger Shop xin chào sếp! Em là Tiger AI, sếp cần em tư vấn sản phẩm gì không? 🐯",
          },
        ]);
      });
  }, [open, token, aiHistoryLoaded]);

  // ── Load dữ liệu Staff Chat ──
  useEffect(() => {
    if (!open || !token || role !== "CUSTOMER") return;
    (async () => {
      try {
        const thread = await getMyThread();
        setStaffThreadId(thread.id);
        const msgs = await getMyMessages(thread.id);
        setStaffMessages(Array.isArray(msgs) ? msgs : []);
        const orders = await getMyOrdersSummary();
        setStaffOrders(Array.isArray(orders) ? orders : []);
      } catch (err) {
        console.error("Staff chat load error:", err);
      }
    })();
  }, [open, token, role]);

  // ── Socket Listeners ──
  useEffect(() => {
    if (!socket || !staffThreadId) return;
    socket.emit("join_thread", { threadId: staffThreadId });

    const handleNewMessage = (msg) => {
      if (String(msg.threadId) === String(staffThreadId)) {
        setStaffMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
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
  }, [socket, staffThreadId]);

  // ── Auto Scroll ──
  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, aiLoading]);

  useEffect(() => {
    staffBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [staffMessages]);

  // ── Gửi tin nhắn đến AI ──
  const onSendAi = useCallback(async () => {
    const msg = aiInput.trim();
    if (!msg) return;

    const userMsg = { id: Date.now(), role: "USER", text: msg };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setAiLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat/ai/talk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();

      // Thêm tin AI reply
      setAiMessages((prev) => [
        ...prev,
        {
          id: "ai-" + Date.now(),
          role: "AI",
          text: data.reply || data.error || "Tiger AI đang bảo trì ạ...",
        },
      ]);

      // ── BUG FIX #2: Chỉ hiển thị voucher khi giá trị THỰC SỰ hợp lệ ──
      // Backend cũng đã sanitize, nhưng double-check ở frontend cho chắc
      if (isValidVoucher(data.voucher)) {
        setTimeout(() => {
          setAiMessages((prev) => [
            ...prev,
            {
              id: "ai-voucher-" + Date.now(),
              role: "AI",
              text: `🎁 TIGER TẶNG SẾP MÃ: **${data.voucher}**\nSếp áp dụng ngay trong trang thanh toán để được giảm giá nhé!`,
              voucher: data.voucher,
            },
          ]);
        }, 1000);
      }
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        { id: "ai-err-" + Date.now(), role: "AI", text: "Lỗi kết nối AI rồi sếp ơi! 🐯" },
      ]);
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, token]);

  // ── Xoá lịch sử AI chat ──
  const onClearAiHistory = useCallback(async () => {
    if (!window.confirm("Xoá toàn bộ lịch sử chat với Tiger AI?")) return;
    try {
      await fetch("http://localhost:5000/api/chat/ai/history", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAiMessages([
        {
          id: "ai-greet-new",
          role: "AI",
          text: "Lịch sử đã được xoá! Em là Tiger AI, sếp cần em tư vấn gì không? 🐯",
        },
      ]);
    } catch {
      alert("Xoá lịch sử thất bại, thử lại sau sếp nhé!");
    }
  }, [token]);

  // ── Gửi tin nhắn đến Staff ──
  const onSendStaff = useCallback(() => {
    const msg = staffInput.trim();
    if (!msg || !staffThreadId || !socket) return;

    const payload = {
      threadId: staffThreadId,
      senderRole: "CUSTOMER",
      senderId: user.id,
      message: msg,
      orderId: staffSelectedOrderId ? Number(staffSelectedOrderId) : null,
    };

    socket.emit("send_message", payload);
    setStaffInput("");
    setStaffSelectedOrderId("");
  }, [staffInput, staffThreadId, socket, user.id, staffSelectedOrderId]);

  if (!token || role !== "CUSTOMER") return null;

  return (
    <>
      <button
        className={`unified-chat-fab ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={32} /> : <MessageCircle size={32} />}
      </button>

      {open && (
        <div
          className="unified-chat-panel"
          style={{ height: chatMode === null ? "400px" : "600px" }}
        >
          {/* ── MENU CHỌN KÊNH ── */}
          {chatMode === null && (
            <div className="chat-menu-container">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "10px",
                  marginBottom: "15px",
                }}
              >
                <h5
                  style={{
                    color: "#FF7A00",
                    fontSize: "16px",
                    margin: 0,
                    fontWeight: 800,
                  }}
                >
                  🐯 Tiger Support
                </h5>
                <button
                  style={{ cursor: "pointer", border: "none", background: "transparent" }}
                  onClick={() => setOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <p
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginBottom: "20px",
                }}
              >
                Chào sếp! Vui lòng chọn kênh hỗ trợ để Tiger phục vụ sếp tốt nhất ạ:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button className="btn-chat-choice" onClick={() => setChatMode("ai")}>
                  <div className="choice-icon ai-icon">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: 700 }}>
                      Chat với AI Tiger
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      Tư vấn sản phẩm nhanh, tặng voucher 🎁
                    </div>
                  </div>
                </button>

                <button className="btn-chat-choice" onClick={() => setChatMode("staff")}>
                  <div className="choice-icon staff-icon">
                    <User size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: 700 }}>
                      Chat với Nhân Viên
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      Hỏi đáp đơn hàng, hỗ trợ trực tuyến 👥
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── KHU VỰC CHAT AI ── */}
          {chatMode === "ai" && (
            <div className="chat-section ai-section" style={{ borderBottom: "none" }}>
              <div className="section-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button className="chat-back-btn" onClick={() => setChatMode(null)}>
                    <ChevronLeft size={16} />
                  </button>
                  <div className="section-title">
                    <Sparkles size={16} /> Tiger AI Tư Vấn
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    title="Xoá lịch sử chat"
                    onClick={onClearAiHistory}
                    style={{
                      cursor: "pointer",
                      border: "none",
                      background: "transparent",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    style={{ cursor: "pointer", border: "none", background: "transparent" }}
                    onClick={() => setOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="chat-body custom-scrollbar">
                {aiMessages.map((m, i) => (
                  <div
                    key={m.id ?? i}
                    className={`chat-msg ${m.role === "USER" ? "me" : "other ai-msg"}`}
                  >
                    <div className="chat-bubble">
                      {m.role === "AI" ? (
                        <AiMessage
                          message={m.text ?? ""}
                          isLast={i === aiMessages.length - 1}
                        />
                      ) : (
                        m.text
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="chat-msg other ai-msg">
                    <div className="chat-bubble">Đang nghĩ... 🐯</div>
                  </div>
                )}
                <div ref={aiBottomRef} />
              </div>

              <div className="chat-input-area">
                <input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Hỏi AI: 'Tư vấn áo thun', 'Giá rẻ nhất'..."
                  onKeyDown={(e) => e.key === "Enter" && onSendAi()}
                />
                <button onClick={onSendAi} disabled={aiLoading}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ── KHU VỰC CHAT NHÂN VIÊN ── */}
          {chatMode === "staff" && (
            <div className="chat-section staff-section">
              <div className="section-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button className="chat-back-btn" onClick={() => setChatMode(null)}>
                    <ChevronLeft size={16} />
                  </button>
                  <div className="section-title">
                    <User size={16} /> Hỗ Trợ Kỹ Thuật
                  </div>
                </div>
                <button
                  style={{ cursor: "pointer", border: "none", background: "transparent" }}
                  onClick={() => setOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-4 py-1 border-b border-gray-100 flex items-center gap-2">
                <select
                  className="text-[10px] w-full border rounded-lg p-1 outline-none"
                  value={staffSelectedOrderId}
                  onChange={(e) => setStaffSelectedOrderId(e.target.value)}
                >
                  <option value="">— Gắn đơn hàng hỗ trợ —</option>
                  {staffOrders.map((o) => (
                    <option key={o.orderId} value={o.orderId}>
                      Đơn #{o.orderId} ({o.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="chat-body custom-scrollbar">
                {staffMessages.map((m, i) => {
                  const isMe =
                    m.senderRole === "CUSTOMER" || m.sender_role === "CUSTOMER";
                  return (
                    <div key={m.id ?? i} className={`chat-msg ${isMe ? "me" : "other"}`}>
                      {m.orderId && (
                        <div className="text-[9px] font-bold text-blue-500 mb-1">
                          ĐƠN #{m.orderId}
                        </div>
                      )}
                      <div className="chat-bubble">{m.message}</div>
                    </div>
                  );
                })}
                <div ref={staffBottomRef} />
              </div>

              <div className="chat-input-area">
                <input
                  value={staffInput}
                  onChange={(e) => setStaffInput(e.target.value)}
                  placeholder="Nhắn hỗ trợ viên..."
                  onKeyDown={(e) => e.key === "Enter" && onSendStaff()}
                />
                <button
                  onClick={onSendStaff}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
