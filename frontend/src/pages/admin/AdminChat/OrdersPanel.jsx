import { useEffect, useState } from "react";
import axios from "axios";
import "./OrdersPanel.css";

function OrdersPanel({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    axios
      .get(`http://localhost:5000/api/chat/admin/orders/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setOrders(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="orders-panel-placeholder">
        <p>📌 Chọn khách hàng để xem lịch sử</p>
      </div>
    );
  }

  return (
    <div className="orders-panel-premium">
      <h3 className="panel-title">📦 Đơn hàng gần đây</h3>

      <div className="orders-list-scroll">
        {loading ? (
          <p className="loading-text">Đang tải...</p>
        ) : orders.length === 0 ? (
          <p className="empty-text">Chưa có đơn hàng nào</p>
        ) : (
          orders.map((o) => (
            <div className="order-glass-card" key={o.id}>
              <div className="order-card-header">
                <span className="order-id-tag">#{o.id}</span>
                <span
                  className={`order-status-pill ${o.status?.toLowerCase()}`}
                >
                  {o.status}
                </span>
              </div>

              <div className="order-card-body">
                <div className="order-price-big">
                  {Number(o.total || 0).toLocaleString()} <span>đ</span>
                </div>
                <div className="order-date-small">
                  {new Date(o.created_at).toLocaleDateString("vi-VN")}
                </div>
              </div>

              <button className="btn-detail-quick">Xem nhanh</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OrdersPanel;
