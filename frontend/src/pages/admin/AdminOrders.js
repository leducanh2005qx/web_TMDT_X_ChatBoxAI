import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOrdersAdmin, updateOrderStatusAdmin } from "../../services/api";
import "./AdminOrders.css";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const fetchOrders = () => {
    getAllOrdersAdmin()
      .then((data) => {
        // ✅ CHỐNG DATA SAI FORMAT
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        alert(err.message || "Lỗi lấy đơn hàng");
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = (orderId, status) => {
    if (
      status === "cancelled" &&
      !window.confirm("Bạn chắc chắn muốn hủy đơn này?")
    ) {
      return;
    }

    updateOrderStatusAdmin(orderId, status)
      .then(fetchOrders)
      .catch((err) => alert(err.message || "Lỗi cập nhật trạng thái"));
  };

  const statusClass = (status) => {
    switch (status) {
      case "pending":
        return "badge pending";
      case "confirmed":
        return "badge confirmed";
      case "completed":
        return "badge completed";
      case "cancelled":
        return "badge cancelled";
      default:
        return "badge";
    }
  };

  return (
    <div className="admin-orders-page">
      <div className="admin-top">
        <button
          className="back-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          ⬅ Quay lại Dashboard
        </button>

        <h2>📦 Quản lý đơn hàng</h2>
      </div>

      {orders.length === 0 ? (
        <p className="empty">Chưa có đơn hàng</p>
      ) : (
        <table className="order-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Email khách</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => {
              // ✅ TƯƠNG THÍCH CẢ id & orderId
              const orderId = o.orderId ?? o.id;

              return (
                <tr key={orderId}>
                  <td>#{orderId}</td>
                  <td>{o.email || "Khách vãng lai"}</td>
                  <td>{Number(o.total).toLocaleString()} đ</td>

                  <td>
                    <span className={statusClass(o.status)}>{o.status}</span>
                  </td>

                  <td>{new Date(o.created_at).toLocaleString()}</td>

                  <td className="actions">
                    {o.status === "pending" && (
                      <>
                        <button
                          className="btn confirm"
                          onClick={() => updateStatus(orderId, "confirmed")}
                        >
                          Xác nhận
                        </button>

                        <button
                          className="btn cancel"
                          onClick={() => updateStatus(orderId, "cancelled")}
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {o.status === "confirmed" && (
                      <>
                        <button
                          className="btn complete"
                          onClick={() => updateStatus(orderId, "completed")}
                        >
                          Hoàn thành
                        </button>

                        <button
                          className="btn cancel"
                          onClick={() => updateStatus(orderId, "cancelled")}
                        >
                          Hủy
                        </button>
                      </>
                    )}

                    {o.status === "completed" && (
                      <span className="done-text">✔ Đã xong</span>
                    )}

                    {o.status === "cancelled" && (
                      <span className="cancel-text">✖ Đã hủy</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminOrders;
