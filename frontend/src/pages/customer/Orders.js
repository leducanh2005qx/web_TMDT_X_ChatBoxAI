import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrders } from "../../services/api";
import "./Orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getMyOrders()
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
        setOrders([]);
      });
  }, []);

  return (
    <div className="orders-page">
      <h2 className="orders-title">📦 Đơn hàng của tôi</h2>

      {orders.length === 0 ? (
        <p className="empty-orders">Bạn chưa có đơn hàng nào</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order.orderId}>
              <div className="order-header">
                <span
                  className="order-id clickable"
                  onClick={() => navigate(`/orders/${order.orderId}`)}
                >
                  Mã đơn #{order.orderId}
                </span>

                <span className="order-total">
                  {Number(order.total).toLocaleString()} đ
                </span>
              </div>

              <div className="order-body">
                <p>
                  📅 Ngày tạo:{" "}
                  {new Date(order.created_at).toLocaleString("vi-VN")}
                </p>

                <p>
                  📌 Trạng thái: <strong>{order.status}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
