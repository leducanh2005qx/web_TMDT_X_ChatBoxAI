import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrderById } from "../../services/api";
import "./OrderDetail.css";

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderById(id)
      .then((data) => setOrder(data))
      .catch((err) => {
        console.error(err);
        alert("Không lấy được chi tiết đơn hàng");
        navigate("/orders");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Hàm helper hiển thị trạng thái Premium
  const renderStatus = (status) => {
    const statusMap = {
      pending: { text: "Chờ xử lý", class: "st-pending" },
      shipping: { text: "Đang giao", class: "st-shipping" },
      completed: { text: "Hoàn tất", class: "st-completed" },
      cancelled: { text: "Đã hủy", class: "st-cancelled" },
    };
    const s = statusMap[status?.toLowerCase()] || {
      text: status,
      class: "st-default",
    };
    return <span className={`premium-status-tag ${s.class}`}>{s.text}</span>;
  };

  if (loading)
    return (
      <div className="order-detail-premium-page">
        <div className="premium-loader">
          <span>✨ TIGER LOADING...</span>
        </div>
      </div>
    );

  if (!order) return null;

  return (
    <div className="order-detail-premium-page">
      {/* Nền động đồng bộ các trang khác */}
      <div className="dynamic-blobs">
        <div className="blob odb-blue"></div>
        <div className="blob odb-purple"></div>
      </div>

      <div className="order-detail-wrapper">
        <header className="detail-header-top">
          <button
            className="back-btn-premium"
            onClick={() => navigate("/orders")}
          >
            ← Quay lại lịch sử
          </button>
          <h2 className="premium-title">
            CHI TIẾT <span>ĐƠN HÀNG #{order.orderId}</span>
          </h2>
        </header>

        <div className="detail-grid-layout">
          {/* CỘT TRÁI: THÔNG TIN HÀNH CHÍNH */}
          <div className="detail-info-col">
            <section className="glass-section-card">
              <h3 className="section-label">📋 Trạng thái đơn hàng</h3>
              <div className="status-display-box">
                {renderStatus(order.status)}
                <p className="order-time-stamp">
                  Đặt lúc: {new Date(order.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
            </section>

            <section className="glass-section-card">
              <h3 className="section-label">👤 Thông tin người nhận</h3>
              <div className="user-info-group">
                <div className="info-item">
                  <label>Người nhận:</label>
                  <span>{order.receiver_name || "Khách hàng Tiger"}</span>
                </div>
                <div className="info-item">
                  <label>Liên hệ:</label>
                  <span>{order.receiver_phone || "—"}</span>
                </div>
                <div className="info-item">
                  <label>Địa chỉ:</label>
                  <span className="address-text">{order.shipping_address}</span>
                </div>
                <div className="info-item highlight">
                  <label>Dự kiến nhận:</label>
                  <span>
                    {order.expected_delivery
                      ? new Date(order.expected_delivery).toLocaleDateString(
                          "vi-VN",
                        )
                      : "Đang xử lý"}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: CHI TIẾT SẢN PHẨM & THANH TOÁN */}
          <div className="detail-products-col">
            <section className="glass-section-card product-list-card">
              <h3 className="section-label">📦 Danh sách sản phẩm</h3>
              <div className="order-items-scroll">
                {order.items.map((item, idx) => (
                  <div className="order-item-premium-row" key={idx}>
                    <img
                      src={`http://localhost:5000/${item.image}`}
                      alt={item.name}
                      onError={(e) => (e.target.src = "/no-image.png")}
                    />
                    <div className="item-main-info">
                      <h4>{item.name}</h4>
                      {item.variant_name && (
                        <span className="variant-badge">
                          {item.variant_name}
                        </span>
                      )}
                      <p className="unit-price">
                        SL: {item.quantity} ×{" "}
                        {Number(item.price).toLocaleString()} đ
                      </p>
                    </div>
                    <div className="item-subtotal">
                      {(item.quantity * item.price).toLocaleString()} đ
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-financial-summary">
                <div className="summary-line">
                  <span>Tạm tính sản phẩm:</span>
                  <span>
                    {Number(order.subtotal || order.total).toLocaleString()} đ
                  </span>
                </div>
                <div className="summary-line">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {Number(order.shipping_fee || 0).toLocaleString()} đ
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="summary-line discount-line">
                    <span>Giảm giá Voucher:</span>
                    <span>- {Number(order.discount).toLocaleString()} đ</span>
                  </div>
                )}
                <div className="grand-total-row">
                  <span>TỔNG THANH TOÁN:</span>
                  <span className="final-price-text">
                    {Number(order.total).toLocaleString()} đ
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
