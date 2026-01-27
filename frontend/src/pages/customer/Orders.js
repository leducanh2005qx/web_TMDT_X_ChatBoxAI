import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrders } from "../../services/api";
import "./Orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyOrders()
      .then((data) => setOrders(data))
      .catch(() => alert("Không lấy được đơn hàng"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="orders-page">Đang tải...</div>;

  return (
    <div className="orders-page">
      <h2 className="page-title">📦 Đơn hàng của tôi</h2>

      {orders.length === 0 ? (
        <div className="empty">Bạn chưa có đơn hàng nào</div>
      ) : (
        <div className="orders-table">
          {/* HEADER */}
          <div className="orders-row orders-header">
            <div>Mã đơn</div>
            <div>Ngày tạo</div>
            <div>Người nhận</div>
            <div>Tổng tiền</div>
            <div>Dự kiến</div>
            <div>Trạng thái</div>
            <div></div>
          </div>

          {/* ROW */}
          {orders.map((o) => (
            <div key={o.orderId} className="orders-row">
              <div className="order-id">#{o.orderId}</div>

              <div>{new Date(o.created_at).toLocaleString("vi-VN")}</div>

              <div>{o.receiver_name || "—"}</div>

              <div className="price">{Number(o.total).toLocaleString()} đ</div>

              <div>
                {o.expected_delivery
                  ? new Date(o.expected_delivery).toLocaleDateString("vi-VN")
                  : "—"}
              </div>

              <div>
                <span className={`status ${o.status}`}>{o.status}</span>
              </div>

              <div>
                <button
                  className="detail-btn"
                  onClick={() => navigate(`/orders/${o.orderId}`)}
                >
                  Xem →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
