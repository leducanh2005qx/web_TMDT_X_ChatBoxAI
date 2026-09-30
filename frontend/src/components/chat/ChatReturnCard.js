import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

const REASONS_RETURN = [
  "Sản phẩm bị lỗi / hư hỏng",
  "Giao sai sản phẩm / màu / size",
  "Sản phẩm không đúng mô tả",
  "Yêu cầu bảo hành",
  "Đổi sang sản phẩm khác",
  "Lý do khác",
];

export default function ChatReturnCard({ message }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // States
  const [selectedOrder, setOrder] = useState("");
  const [actionType, setActionType] = useState(""); 
  // 'cancel', 'address', 'return'
  
  const [returnReason, setReturnReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  
  const [newAddress, setNewAddress] = useState("");

  const [submitting, setSub] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch đơn hàng
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    fetch(`${API_URL}/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        // Bỏ các đơn đã huỷ
        const eligible = (Array.isArray(data) ? data : data.orders || [])
          .filter(o => o.status !== "cancelled");
        setOrders(eligible);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Xử lý logic chọn order
  const selectedOrderObj = orders.find(o => String(o.orderId || o.id) === selectedOrder);
  const isPending = selectedOrderObj?.status === "pending";
  const isProcessing = selectedOrderObj?.status === "processing";
  const isCompleted = selectedOrderObj?.status === "completed";
  const isShipped = selectedOrderObj?.status === "shipped";

  // Khi đổi đơn hàng, reset các field con
  useEffect(() => {
    setActionType("");
    setReturnReason("");
    setCustomReason("");
    setNewAddress("");
  }, [selectedOrder]);

  // Validations
  let finalReason = "";
  let canSubmit = false;

  if (selectedOrderObj) {
    if (actionType === "cancel") {
      canSubmit = isPending;
    } else if (actionType === "address") {
      canSubmit = (isPending || isProcessing) && newAddress.trim().length >= 10;
    } else if (actionType === "return") {
      finalReason = returnReason === "Lý do khác" ? customReason : returnReason;
      canSubmit = isCompleted && finalReason.trim().length >= 5;
    } else if (actionType === "support") {
      finalReason = returnReason === "Lý do khác" ? customReason : returnReason;
      canSubmit = finalReason.trim().length >= 5;
    }
  }

  canSubmit = canSubmit && !submitting && !result?.ok;

  // Gọi API
  async function handleSubmit() {
    if (!canSubmit) return;
    setSub(true);
    const token = localStorage.getItem("token");
    let url = "";
    let method = "POST";
    let bodyData = {};

    if (actionType === "cancel") {
      url = `${API_URL}/orders/${selectedOrder}/cancel`;
    } else if (actionType === "address") {
      url = `${API_URL}/orders/${selectedOrder}/address`;
      method = "PUT";
      bodyData = { address: newAddress };
    } else if (actionType === "return" || actionType === "support") {
      url = `${API_URL}/orders/${selectedOrder}/return-warranty`;
      bodyData = { reason: finalReason };
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: Object.keys(bodyData).length > 0 ? JSON.stringify(bodyData) : undefined,
      });
      const json = await res.json();
      if (res.ok) {
        let successMsg = "✅ Gửi yêu cầu thành công! Nhân viên sẽ liên hệ bạn sớm nhé 🐯";
        if (actionType === "cancel") successMsg = "✅ Hủy đơn hàng thành công!";
        if (actionType === "address") successMsg = "✅ Đổi địa chỉ nhận hàng thành công!";
        setResult({ ok: true, msg: successMsg });
      } else {
        setResult({ ok: false, msg: json.message || "❌ Gửi thất bại, thử lại sau." });
      }
    } catch {
      setResult({ ok: false, msg: "❌ Lỗi kết nối server." });
    } finally {
      setSub(false);
    }
  }

  const token = localStorage.getItem("token");

  // Style map cho status
  const statusLabels = {
    pending: "Chờ xác nhận",
    processing: "Đang chuẩn bị",
    shipped: "Đang giao",
    completed: "Đã giao",
    cancelled: "Đã hủy"
  };

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <span style={{ fontSize: 20 }}>🔧</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#e74c3c" }}>
            Hỗ trợ đơn hàng
          </div>
          <div style={{ fontSize: 11, color: "#777" }}>
            {message || "Chọn đơn hàng cần hỗ trợ (đổi địa chỉ, hủy đơn, bảo hành...)"}
          </div>
        </div>
      </div>

      {!token ? (
        <div style={styles.infoBox}>
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
            Bạn cần đăng nhập để được hỗ trợ.
          </p>
          <button onClick={() => navigate("/login")} style={styles.btnPrimary}>
            Đăng nhập ngay
          </button>
        </div>
      ) : loading ? (
        <p style={{ fontSize: 12, color: "#888" }}>⏳ Đang tải đơn hàng…</p>
      ) : orders.length === 0 ? (
        <div style={styles.infoBox}>
          <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
            Chưa có đơn hàng nào để hỗ trợ.
          </p>
          <button onClick={() => navigate("/products")} style={styles.btnOutline}>
            Xem sản phẩm →
          </button>
        </div>
      ) : result?.ok ? (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 28 }}>✅</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#27ae60", marginTop: 6 }}>
            {result.msg}
          </div>
          <button onClick={() => navigate("/orders")} style={{ ...styles.btnOutline, marginTop: 10 }}>
            Kiểm tra đơn hàng →
          </button>
        </div>
      ) : (
        <>
          {/* Chọn đơn hàng */}
          <div style={styles.fieldRow}>
            <label style={styles.label}>🛒 Đơn hàng:</label>
            <select
              value={selectedOrder}
              onChange={e => setOrder(e.target.value)}
              style={styles.select}
            >
              <option value="">— Chọn đơn hàng —</option>
              {orders.map(o => (
                <option key={o.orderId || o.id} value={o.orderId || o.id}>
                  #{o.orderId || o.id} – {statusLabels[o.status] || o.status} – {Number(o.total || o.total_price || o.totalPrice || 0).toLocaleString("vi-VN")}đ
                </option>
              ))}
            </select>
          </div>

          {/* Chọn loại hỗ trợ tùy theo trạng thái */}
          {selectedOrderObj && (
            <div style={styles.fieldRow}>
              <label style={styles.label}>🎯 Bạn cần hỗ trợ gì?</label>
              <div style={styles.actionGrid}>
                {/* Hủy đơn - chỉ pending */}
                {isPending && (
                  <button
                    onClick={() => setActionType("cancel")}
                    style={actionBtnStyle(actionType === "cancel")}
                  >
                    Hủy đơn hàng
                  </button>
                )}
                {/* Sửa địa chỉ - pending / processing */}
                {(isPending || isProcessing) && (
                  <button
                    onClick={() => setActionType("address")}
                    style={actionBtnStyle(actionType === "address")}
                  >
                    Đổi địa chỉ
                  </button>
                )}
                {/* Bảo hành / Đổi trả - chỉ completed */}
                {isCompleted && (
                  <button
                    onClick={() => setActionType("return")}
                    style={actionBtnStyle(actionType === "return")}
                  >
                    Bảo hành / Đổi trả
                  </button>
                )}
                {/* Lý do khác (để gửi ticket hỗ trợ) */}
                <button
                  onClick={() => setActionType("support")}
                  style={actionBtnStyle(actionType === "support")}
                >
                  Yêu cầu khác
                </button>
              </div>
            </div>
          )}

          {/* Các input chi tiết theo Action */}
          {actionType === "address" && (
            <div style={styles.fieldRow}>
              <label style={styles.label}>📍 Địa chỉ mới:</label>
              <textarea
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                placeholder="Nhập địa chỉ mới (Tỉnh, huyện, xã, số nhà...)"
                rows={2}
                style={styles.textarea}
              />
            </div>
          )}

          {(actionType === "return" || actionType === "support") && (
            <div style={styles.fieldRow}>
              <label style={styles.label}>📋 Chi tiết:</label>
              {actionType === "return" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 5 }}>
                  {REASONS_RETURN.map(r => (
                    <button
                      key={r}
                      onClick={() => setReturnReason(r)}
                      style={reasonChipStyle(returnReason === r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
              {(actionType === "support" || returnReason === "Lý do khác") && (
                <textarea
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Mô tả chi tiết yêu cầu hỗ trợ của bạn..."
                  rows={3}
                  style={styles.textarea}
                />
              )}
            </div>
          )}

          {actionType === "cancel" && (
            <div style={{ fontSize: 12, color: "#e74c3c", marginTop: 5 }}>
              ⚠️ Bạn có chắc chắn muốn hủy đơn hàng này không?
            </div>
          )}

          {/* Lỗi hiển thị */}
          {result?.ok === false && (
            <div style={{ fontSize: 12, color: "#e74c3c" }}>{result.msg}</div>
          )}

          {/* Submit */}
          {actionType && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                ...styles.btnDanger,
                opacity: canSubmit ? 1 : 0.45,
                cursor: canSubmit ? "pointer" : "not-allowed",
                marginTop: 5
              }}
            >
              {submitting ? "Đang xử lý…" : "📤 Xác nhận"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

const actionBtnStyle = (active) => ({
  flex: "1 1 45%",
  padding: "6px 8px",
  borderRadius: 6,
  fontSize: 11,
  cursor: "pointer",
  fontWeight: 600,
  transition: "all .15s",
  textAlign: "center",
  background: active ? "#e74c3c" : "#f5f5f5",
  color: active ? "#fff" : "#333",
  border: active ? "1.5px solid #e74c3c" : "1.5px solid #ddd",
});

const reasonChipStyle = (active) => ({
  padding: "4px 10px",
  borderRadius: 20,
  fontSize: 11,
  cursor: "pointer",
  fontWeight: 500,
  textAlign: "left",
  background: active ? "#e74c3c" : "#f5f5f5",
  color: active ? "#fff" : "#333",
  border: active ? "1.5px solid #e74c3c" : "1.5px solid #ddd",
});

const styles = {
  card: {
    border: "1.5px solid #ffc4c4",
    borderRadius: 12,
    padding: "12px 14px",
    background: "#fff9f9",
    maxWidth: 320,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    borderBottom: "1px solid #ffe0e0",
    paddingBottom: 8,
  },
  infoBox: { display: "flex", flexDirection: "column", gap: 8 },
  fieldRow: { display: "flex", flexDirection: "column", gap: 6 },
  actionGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  label: { fontSize: 12, color: "#555", fontWeight: 600 },
  select: {
    fontSize: 12,
    border: "1.5px solid #ddd",
    borderRadius: 8,
    padding: "6px 8px",
    outline: "none",
    background: "#fff",
    cursor: "pointer",
  },
  textarea: {
    fontSize: 12,
    border: "1.5px solid #ddd",
    borderRadius: 8,
    padding: "6px 8px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  btnPrimary: {
    background: "#FF7A00", color: "#fff", border: "none", borderRadius: 8,
    padding: "8px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%",
  },
  btnOutline: {
    background: "#fff", color: "#FF7A00", border: "1.5px solid #FF7A00",
    borderRadius: 8, padding: "7px 0", fontWeight: 600, fontSize: 12, cursor: "pointer", width: "100%",
  },
  btnDanger: {
    background: "#e74c3c", color: "#fff", border: "none", borderRadius: 8,
    padding: "9px 0", fontWeight: 700, fontSize: 13, width: "100%",
  },
};
