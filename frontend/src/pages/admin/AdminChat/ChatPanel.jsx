import { useEffect, useState } from "react";

function ChatPanel({ user }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;

    fetch(
      `http://localhost:5000/api/chat/admin/orders/${user.userId}`,
      {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }
    )
      .then((res) => res.json())
      .then(setOrders);
  }, [user]);

  if (!user) {
    return <div className="chat-panel empty">👈 Chọn khách để chat</div>;
  }

  return (
    <div className="chat-panel">
      <h3>Chat với {user.email}</h3>

      <div className="orders">
        <h4>🧾 Đơn hàng gần đây</h4>

        {orders.length === 0 && <p>Chưa có đơn hàng</p>}

        {orders.map((o) => (
          <div key={o.id} className="order-card">
            <div>#{o.id}</div>
            <div>{Number(o.total).toLocaleString()} đ</div>
            <div className={`status ${o.status}`}>{o.status}</div>
            <small>{new Date(o.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatPanel;
