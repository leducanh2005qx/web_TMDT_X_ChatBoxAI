import React, { useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api";

/**
 * ChatVoucherCard – Hiển thị voucher AI vừa tạo trong chat
 * Props:
 *   data: { voucherCode, discount, discountLabel, expiresIn (phút) }
 */
export default function ChatVoucherCard({ data }) {
  const { voucherCode, discountLabel, expiresIn = 15 } = data || {};
  const [copied, setCopied]       = useState(false);
  const [secondsLeft, setSeconds] = useState(expiresIn * 60);
  const [expired, setExpired]     = useState(false);
  const [applying, setApplying]   = useState(false);
  const [applyMsg, setApplyMsg]   = useState(null);

  // ── Countdown timer
  useEffect(() => {
    if (!voucherCode) return;
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(timer); setExpired(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [voucherCode]);

  if (!data) return null;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  // ── Copy code
  function handleCopy() {
    if (!voucherCode) return;
    navigator.clipboard.writeText(voucherCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Áp dụng voucher ngay vào ví
  async function handleApply() {
    if (!voucherCode || expired) return;
    setApplying(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/vouchers/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: voucherCode }),
      });
      const json = await res.json();
      setApplyMsg(res.ok ? "✅ Đã lưu vào ví voucher!" : (json.message || "❌ Không thể áp dụng."));
    } catch {
      setApplyMsg("❌ Lỗi kết nối, thử lại sau.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <span style={{ fontSize: 20 }}>🎁</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#FF7A00" }}>
            Ưu đãi từ Tiger AI
          </div>
          <div style={{ fontSize: 11, color: "#777" }}>
            {discountLabel || (voucherCode ? "Voucher đặc biệt" : "Ưu đãi kèm đơn")}
          </div>
        </div>
      </div>

      {voucherCode ? (
        <>
          {/* Mã voucher */}
          <div style={styles.codeBox}>
            <span style={styles.codeText}>{voucherCode}</span>
            <button onClick={handleCopy} style={styles.copyBtn}>
              {copied ? "✔ Đã copy" : "📋 Copy"}
            </button>
          </div>

          {/* Countdown */}
          {!expired ? (
            <div style={styles.countdown}>
              ⏰ Hết hạn sau:{" "}
              <span style={{ fontWeight: 700, color: secondsLeft < 60 ? "#e74c3c" : "#FF7A00" }}>
                {mm}:{ss}
              </span>
            </div>
          ) : (
            <div style={{ ...styles.countdown, color: "#e74c3c" }}>
              ❌ Voucher đã hết hạn
            </div>
          )}

          {/* Apply button */}
          {!expired && !applyMsg && (
            <button
              onClick={handleApply}
              disabled={applying}
              style={{ ...styles.btnPrimary, opacity: applying ? 0.7 : 1 }}
            >
              {applying ? "Đang áp dụng…" : "💳 Lưu vào ví voucher"}
            </button>
          )}
          {applyMsg && <div style={styles.applyMsg}>{applyMsg}</div>}
        </>
      ) : (
        /* Không có mã → quà kèm đơn */
        <div style={styles.noCodeBox}>
          <span style={{ fontSize: 28 }}>🛍️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Quà tặng kèm đơn</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              Ưu đãi sẽ tự động áp dụng khi bạn thanh toán đơn hàng.
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      <div style={styles.hint}>
        💡 Dùng mã tại trang <strong>Thanh toán</strong> → ô "Nhập mã giảm giá"
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: "1.5px solid #FFD580",
    borderRadius: 12,
    padding: "12px 14px",
    background: "linear-gradient(135deg, #fffbf2 0%, #fff8e8 100%)",
    maxWidth: 300,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    borderBottom: "1px dashed #FFD580",
    paddingBottom: 8,
  },
  codeBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#fff",
    border: "1.5px dashed #FF7A00",
    borderRadius: 8,
    padding: "8px 12px",
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 15,
    fontWeight: 700,
    color: "#FF7A00",
    letterSpacing: 1.5,
  },
  copyBtn: {
    background: "#FF7A00",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  countdown: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
    background: "#fff8ec",
    borderRadius: 6,
    padding: "4px 8px",
  },
  btnPrimary: {
    background: "#FF7A00",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 0",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    width: "100%",
  },
  applyMsg: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 0",
  },
  noCodeBox: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    background: "#fff",
    borderRadius: 8,
    padding: "10px 12px",
    border: "1px solid #ffe0a0",
  },
  hint: {
    fontSize: 11,
    color: "#999",
    borderTop: "1px solid #ffe0c4",
    paddingTop: 8,
    lineHeight: 1.5,
  },
};
