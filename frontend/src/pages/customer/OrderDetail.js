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
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => {
        console.error(err);
        alert("Không lấy được chi tiết đơn hàng");
        navigate("/orders");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Hàm hiển thị Badge trạng thái đơn hàng
  const renderStatus = (status) => {
    const statusMap = {
      pending: { text: "Chờ xử lý", class: "st-pending" },
      confirmed: { text: "Đã xác nhận", class: "st-confirmed" },
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

  // ✅ Hàm hiển thị Phương thức & Trạng thái thanh toán chính xác
  const renderPaymentInfo = (order) => {
    // Đảm bảo lấy đúng giá trị, ép về chữ thường để so sánh
    const method = String(order.payment_method || "cod")
      .toLowerCase()
      .trim();
    const isQR = method === "qr" || method === "banking qr";

    const methodText = isQR ? "Chuyển khoản QR (VietQR)" : "Tiền mặt (COD)";

    // Logic: QR coi như đã trả ngay, COD chỉ tính là đã trả khi đơn hàng "Completed"
    const isPaid = isQR || order.status?.toLowerCase() === "completed";

    return (
      <div className="payment-status-wrapper">
        <div className="info-row">
          <label>Hình thức:</label>
          <span className="method-val">{methodText}</span>
        </div>
        <div className="info-row">
          <label>Tình trạng:</label>
          <span className={`payment-badge ${isPaid ? "paid" : "unpaid"}`}>
            {isPaid ? "✓ Đã thanh toán" : "⚠ Chưa thanh toán"}
          </span>
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="order-detail-premium-page">
        <div className="premium-loader">
          <span>✨ TIGER SHOP LOADING...</span>
        </div>
      </div>
    );

  if (!order) return null;

  return (
    <div className="order-detail-premium-page">
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
            {/* Sửa lại order.id cho khớp với cột thực tế trong DB */}
            CHI TIẾT <span>ĐƠN HÀNG #{order.id}</span>
          </h2>
        </header>

        <div className="detail-grid-layout">
          {/* CỘT TRÁI: CÁC THÔNG TIN CHUNG */}
          <div className="detail-info-col">
            {/* Ô 1: Trạng thái đơn */}
            <section className="glass-section-card">
              <h3 className="section-label">📋 Trạng thái vận chuyển</h3>
              <div className="status-display-box">
                {renderStatus(order.status)}
                <p className="order-time-stamp">
                  Ngày đặt: {new Date(order.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
            </section>

            {/* Ô 2: Thanh toán */}
            <section className="glass-section-card">
              <h3 className="section-label">💳 Thông tin thanh toán</h3>
              {renderPaymentInfo(order)}
            </section>

            {/* Ô 3: Người nhận */}
            <section className="glass-section-card">
              <h3 className="section-label">👤 Thông tin giao hàng</h3>
              <div className="user-info-group">
                <div className="info-item">
                  <label>Người nhận:</label>
                  <span>{order.receiver_name || "Lê Đình Đức Anh"}</span>
                </div>
                <div className="info-item">
                  <label>Số điện thoại:</label>
                  <span>{order.receiver_phone || "0373271916"}</span>
                </div>
                <div className="info-item">
                  <label>Địa chỉ nhận:</label>
                  <span className="address-text">{order.shipping_address}</span>
                </div>
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: CHI TIẾT SẢN PHẨM */}
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
                        Số lượng: {item.quantity} ×{" "}
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
                  <span>Tạm tính:</span>
                  <span>
                    {Number(order.subtotal || order.total).toLocaleString()} đ
                  </span>
                </div>
                <div className="summary-line">
                  <span>Phí giao hàng:</span>
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
                <div className="total-divider"></div>
                <div className="grand-total-row">
                  <span>TỔNG CỘNG:</span>
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
