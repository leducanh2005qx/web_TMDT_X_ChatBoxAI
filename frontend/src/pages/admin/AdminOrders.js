import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import { getAllOrdersAdmin } from "../../services/api";
import "./AdminOrders.css";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllOrdersAdmin().then((data) => {
      console.log("ADMIN ORDERS:", data); // 🔍 debug
      setOrders(Array.isArray(data) ? data : []);
    });
  }, []);

  return (
    <>
      <Header />

      <div className="admin-page">
        <div className="admin-top">
          <button
            className="back-btn"
            onClick={() => navigate("/admin/dashboard")}
          >
            ⬅ Quay lại Dashboard
          </button>

          <h2>📦 Danh sách đơn hàng</h2>
        </div>

        {orders.length === 0 ? (
          <p className="empty">Chưa có đơn hàng</p>
        ) : (
          <table className="order-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email khách</th>
                <th>Tổng tiền</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o.orderId}>
                  <td>{o.orderId}</td>
                  <td>{o.email || "Khách không đăng nhập"}</td>
                  <td>{Number(o.total).toLocaleString()} đ</td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default AdminOrders;
