import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderById } from "../../services/api";

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    getOrderById(id)
      .then((data) => {
        setOrder(data);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError("Không thể tải đơn hàng");
      });
  }, [id]);

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: "0 auto" }}>
      <button onClick={() => navigate("/orders")}>← Quay lại</button>

      <h2>📄 Chi tiết đơn hàng</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!order && !error && <p>Đang tải...</p>}

      {order && (
        <>
          <p>
            <b>Mã đơn:</b> {order.orderId}
          </p>
          <p>
            <b>Trạng thái:</b> {order.status}
          </p>
          <p>
            <b>Tổng tiền:</b> {Number(order.total).toLocaleString()} đ
          </p>

          <h3>Sản phẩm</h3>
          <ul>
            {order.items.map((item, index) => (
              <li key={index}>
                {item.name} – SL: {item.quantity} –{" "}
                {Number(item.price).toLocaleString()} đ
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default OrderDetail;
