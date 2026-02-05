import { useEffect, useState } from "react";
import {
  getAvailableVouchersToReceive,
  receiveUserVoucher,
} from "../../services/api";
import "./Vouchers.css";

function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVouchers = () => {
    setLoading(true);
    getAvailableVouchersToReceive()
      .then((data) => setVouchers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleReceive = async (voucherId) => {
    try {
      await receiveUserVoucher(voucherId);
      alert("🎉 Nhận voucher thành công! Mã đã được lưu vào kho của bạn.");
      loadVouchers();
    } catch (error) {
      alert("Không thể nhận mã lúc này.");
    }
  };

  const renderValue = (v) => {
    if (v.type === "percent") return `${v.value}%`;
    if (v.type === "fixed") return `${v.value / 1000}k`;
    if (v.type === "free_ship") return `FREE`;
    return "";
  };

  return (
    <div className="vouchers-premium-page">
      {/* Nền động đồng bộ hệ thống */}
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

        {loading ? (
          <div className="premium-loader-container">
            <div className="premium-spinner"></div>
            <p>Đang tìm kiếm ưu đãi...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="empty-vouchers-glass">
            <div className="empty-icon">🎟️</div>
            <h3>Hiện chưa có mã giảm giá mới</h3>
            <p>Tiger Shop sẽ sớm cập nhật thêm các chương trình khuyến mãi.</p>
          </div>
        ) : (
          <div className="vouchers-grid-premium">
            {vouchers.map((v) => (
              <div
                key={v.voucher_id}
                className={`voucher-ticket-card ${v.type}`}
              >
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
                        Giảm tối đa: <b>{v.max_discount.toLocaleString()}đ</b>
                      </p>
                    )}

                    <div className="ticket-footer">
                      <span className="expiry">
                        HSD: {v.end_date ? v.end_date : "Vô thời hạn"}
                      </span>
                      <span className="stock">Còn lại: {v.quantity}</span>
                    </div>
                  </div>

                  <button
                    className="btn-receive-voucher"
                    disabled={v.quantity === 0}
                    onClick={() => handleReceive(v.voucher_id)}
                  >
                    {v.quantity === 0 ? "HẾT MÃ" : "LƯU MÃ"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Vouchers;
