import { useEffect, useState } from "react";
import axios from "axios";

function OrdersPanel({ user }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const token = localStorage.getItem("token");

    axios
      .get(`http://localhost:5000/api/chat/admin/orders/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setOrders(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setOrders([]);
      });
  }, [user]);

  if (!user) {
    return <p>📌 Chọn user để xem đơn hàng</p>;
  }

  return (
    <>
      <h3>📦 Đơn hàng gần đây</h3>

      {orders.length === 0 ? (
        <p>Không có đơn hàng</p>
      ) : (
        orders.map((o) => (
          <div className="order-card" key={o.id}>
            <div className="order-id">#{o.id}</div>
            <div className="order-price">
              {Number(o.total).toLocaleString()} đ
            </div>
            <div className="order-status">{o.status}</div>
            <div className="order-time">
              {new Date(o.created_at).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </>
  );
}

export default OrdersPanel;
