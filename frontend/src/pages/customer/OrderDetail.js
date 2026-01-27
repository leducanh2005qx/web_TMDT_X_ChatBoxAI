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

  if (loading) {
    return <div className="order-detail-page">Đang tải...</div>;
  }

  if (!order) return null;

  return (
    <div className="order-detail-page">
      <button className="back-btn" onClick={() => navigate("/orders")}>
        ← Quay lại
      </button>

      <h2 className="page-title">📄 Chi tiết đơn hàng</h2>

      {/* ===== TỔNG QUAN ===== */}
      <div className="order-summary card">
        <div className="summary-item">
          <span>Mã đơn</span>
          <b>#{order.orderId}</b>
        </div>

        <div className="summary-item">
          <span>Trạng thái</span>
          <span className={`status ${order.status}`}>{order.status}</span>
        </div>

        <div className="summary-item">
          <span>Tổng tiền</span>
          <b>{Number(order.total).toLocaleString()} đ</b>
        </div>

        <div className="summary-item">
          <span>Ngày đặt</span>
          <b>{new Date(order.created_at).toLocaleDateString("vi-VN")}</b>
        </div>
      </div>

      {/* ===== NGƯỜI NHẬN ===== */}
      <div className="card">
        <h3>👤 Thông tin người nhận</h3>

        <div className="info-grid">
          <div>
            <span>Họ tên</span>
            <b>{order.receiver_name || "(chưa có)"}</b>
          </div>

          <div>
            <span>Số điện thoại</span>
            <b>{order.receiver_phone || "(chưa có)"}</b>
          </div>

          <div className="full">
            <span>Địa chỉ giao hàng</span>
            <b>{order.shipping_address}</b>
          </div>

          <div>
            <span>Dự kiến nhận</span>
            <b>
              {order.expected_delivery
                ? new Date(order.expected_delivery).toLocaleDateString("vi-VN")
                : "(chưa có)"}
            </b>
          </div>
        </div>
      </div>

      {/* ===== SẢN PHẨM ===== */}
      <div className="card">
        <h3>📦 Sản phẩm</h3>

        <div className="product-list">
          {order.items.map((item, idx) => (
            <div className="product-row" key={idx}>
              <img
                src={`http://localhost:5000/${item.image}`}
                alt={item.name}
                onError={(e) => (e.target.src = "/no-image.png")}
              />

              <div className="product-info">
                <b>
                  {item.name}
                  {item.variant_name ? ` (${item.variant_name})` : ""}
                </b>
                <span>
                  SL: {item.quantity} × {Number(item.price).toLocaleString()} đ
                </span>
              </div>

              <div className="product-total">
                {Number(item.quantity * item.price).toLocaleString()} đ
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
