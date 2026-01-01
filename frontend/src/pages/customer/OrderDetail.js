import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import "./OrderDetail.css";

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Không tải được đơn hàng");
        }
        return res.json();
      })
      .then((data) => {
        console.log("ORDER DETAIL:", data);
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert("Không tải được đơn hàng");
        navigate("/orders");
      });
  }, [id, navigate]);

  if (loading) {
    return (
      <>
        <Header />
        <p style={{ padding: 20 }}>Đang tải đơn hàng...</p>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <p style={{ padding: 20 }}>Không tìm thấy đơn hàng</p>
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="order-detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ⬅ Quay lại
        </button>

        <h2>📦 Chi tiết đơn hàng #{order.orderId}</h2>

        <p className="order-date">
          📅 Ngày đặt:{" "}
          {order.created_at
            ? new Date(order.created_at).toLocaleString("vi-VN")
            : "Không xác định"}
        </p>

        <div className="order-items">
          {order.items.map((item, index) => (
            <div className="order-item" key={index}>
              <img
                src={`http://localhost:5000/${item.image}`}
                alt={item.name}
              />

              <div className="info">
                <h4>{item.name}</h4>
                <p>Số lượng: {Number(item.quantity) || 0}</p>
                <p>Giá: {(Number(item.price) || 0).toLocaleString()} đ</p>
              </div>

              <div className="subtotal">
                {(
                  (Number(item.price) || 0) * (Number(item.quantity) || 0)
                ).toLocaleString()}{" "}
                đ
              </div>
            </div>
          ))}
        </div>

        <h3 className="order-total">
          💰 Tổng tiền: {(Number(order.total) || 0).toLocaleString()} đ
        </h3>
      </div>
    </>
  );
}

export default OrderDetail;
