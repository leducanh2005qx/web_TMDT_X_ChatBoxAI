import { useEffect, useState } from "react";
import {
  getAvailableVouchersToReceive,
  receiveUserVoucher,
  getMyVouchers,
} from "../../services/api";
import "./Vouchers.css";

function Vouchers() {
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available"); // "available" | "my"

  const loadAvailable = () => {
    setLoading(true);
    getAvailableVouchersToReceive()
      .then((data) => setAvailableVouchers(Array.isArray(data) ? data : []))
      .catch(() => setAvailableVouchers([]))
      .finally(() => setLoading(false));
  };

  const loadMyVouchers = () => {
    setLoading(true);
    getMyVouchers()
      .then((data) => setMyVouchers(Array.isArray(data) ? data : []))
      .catch(() => setMyVouchers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === "available") {
      loadAvailable();
    } else {
      loadMyVouchers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleReceive = async (voucherId) => {
    try {
      await receiveUserVoucher(voucherId);
      alert("🎉 Nhận voucher thành công! Mã đã được lưu vào kho của bạn.");
      loadAvailable();
    } catch (error) {
      alert(error.message || "Không thể nhận mã lúc này.");
    }
  };

  const renderValue = (v) => {
    if (v.type === "percent") {
      return `${v.value}%`;
    }
    if (v.type === "fixed" || v.type === "free_ship") {
      const val = Number(v.value);
      if (v.type === "free_ship" && val === 0) return "FREE";
      return val >= 1000 ? `${val / 1000}k` : `${val}đ`;
    }
    return v.value;
  };

  const renderVoucherCard = (v, isMyVoucher = false) => (
    <div key={v.voucher_id} className={`voucher-ticket-card ${v.type}`}>
      {/* LEFT: VALUE */}
      <div className="ticket-left">
        <div className="value-box">
          <span className="val-text">{renderValue(v)}</span>
          <span className="off-text">
            {v.type === "free_ship" ? "SHIP" : "OFF"}
          </span>
        </div>
        <div className="ticket-cut-circles"></div>
      </div>

      {/* RIGHT: DETAILS */}
      <div className="ticket-right">
        <div className="ticket-content">
          <div className="code-badge">{v.code}</div>
          <p className="min-order">
            Đơn tối thiểu:{" "}
            <b>{(v.min_order_value || 0).toLocaleString()}đ</b>
          </p>

          {v.type === "percent" && v.max_discount && (
            <p className="max-info">
              Giảm tối đa:{" "}
              <b>{Number(v.max_discount).toLocaleString()}đ</b>
            </p>
          )}

          <div className="ticket-footer">
            <span className="expiry">
              HSD:{" "}
              {v.end_date
                ? new Date(v.end_date).toLocaleDateString("vi-VN")
                : "Vô thời hạn"}
            </span>
            {!isMyVoucher && (
              <span className="stock">Còn lại: {v.quantity}</span>
            )}
            {isMyVoucher && (
              <span className="stock received-badge">✅ Đã nhận</span>
            )}
          </div>
        </div>

        {!isMyVoucher && (
          <button
            className="btn-receive-voucher"
            disabled={v.quantity === 0}
            onClick={() => handleReceive(v.voucher_id)}
          >
            {v.quantity === 0 ? "HẾT MÃ" : "LƯU MÃ"}
          </button>
        )}

        {isMyVoucher && (
          <div className="my-voucher-status">
            <span className="status-text">Sẵn sàng sử dụng</span>
          </div>
        )}
      </div>
    </div>
  );

  const vouchers = activeTab === "available" ? availableVouchers : myVouchers;

  return (
    <div className="vouchers-premium-page">
      <div className="dynamic-blobs">
        <div className="blob vb-blue"></div>
        <div className="blob vb-purple"></div>
      </div>

      <div className="vouchers-wrapper">
        <header className="vouchers-header-top">
          <h2 className="premium-title">
            KHO <span>VOUCHER</span>
          </h2>
          <p className="subtitle">Săn mã ưu đãi, mua sắm không lo về giá</p>
        </header>

        {/* TAB NAVIGATION */}
        <div className="voucher-tabs">
          <button
            className={`voucher-tab ${activeTab === "available" ? "active" : ""}`}
            onClick={() => setActiveTab("available")}
          >
            🎟️ Nhận Voucher
          </button>
          <button
            className={`voucher-tab ${activeTab === "my" ? "active" : ""}`}
            onClick={() => setActiveTab("my")}
          >
            🎁 Voucher Của Tôi
          </button>
        </div>

        {loading ? (
          <div className="premium-loader-container">
            <div className="premium-spinner"></div>
            <p>Đang tìm kiếm ưu đãi...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="empty-vouchers-glass">
            <div className="empty-icon">{activeTab === "available" ? "🎟️" : "📦"}</div>
            <h3>
              {activeTab === "available"
                ? "Hiện chưa có mã giảm giá mới"
                : "Bạn chưa nhận voucher nào"}
            </h3>
            <p>
              {activeTab === "available"
                ? "Tiger Shop sẽ sớm cập nhật thêm các chương trình khuyến mãi."
                : "Hãy qua tab \"Nhận Voucher\" để săn mã ưu đãi ngay!"}
            </p>
          </div>
        ) : (
          <div className="vouchers-grid-premium">
            {vouchers.map((v) => renderVoucherCard(v, activeTab === "my"))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Vouchers;
