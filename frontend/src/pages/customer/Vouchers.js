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
    await receiveUserVoucher(voucherId);
    alert("🎉 Nhận voucher thành công");
    loadVouchers();
  };

  const renderValue = (v) => {
    if (v.type === "percent") return `Giảm ${v.value}%`;
    if (v.type === "fixed") return `Giảm ${v.value.toLocaleString()} đ`;
    if (v.type === "free_ship")
      return `Free ship ${v.value.toLocaleString()} đ`;
    return "";
  };

  return (
    <div className="voucher-page">
      <h2>🎁 Kho Voucher</h2>

      {loading ? (
        <p>Đang tải...</p>
      ) : vouchers.length === 0 ? (
        <p>Không có voucher khả dụng</p>
      ) : (
        <div className="voucher-grid">
          {vouchers.map((v) => (
            <div key={v.voucher_id} className={`voucher-card ${v.type}`}>
              {/* LEFT */}
              <div className="voucher-left">
                <div className="voucher-value">{renderValue(v)}</div>
                <div className="voucher-type">
                  {v.type === "free_ship" ? "🚚 Free ship" : "🎁 Giảm giá"}
                </div>
              </div>

              {/* RIGHT */}
              <div className="voucher-right">
                <div className="voucher-code">{v.code}</div>

                <div className="voucher-info">
                  <div>
                    Đơn tối thiểu:{" "}
                    <b>{(v.min_order_value || 0).toLocaleString()} đ</b>
                  </div>

                  {v.type === "percent" && v.max_discount && (
                    <div>
                      Giảm tối đa: <b>{v.max_discount.toLocaleString()} đ</b>
                    </div>
                  )}

                  <div>
                    Hạn sử dụng:{" "}
                    <b>{v.end_date ? v.end_date : "Không giới hạn"}</b>
                  </div>

                  <div>Còn lại: {v.quantity}</div>
                </div>

                <button
                  className="voucher-btn"
                  disabled={v.quantity === 0}
                  onClick={() => handleReceive(v.voucher_id)}
                >
                  {v.quantity === 0 ? "Hết" : "Nhận"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Vouchers;
