import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOrdersAdmin, updateOrderStatusAdmin } from "../../services/api";
import "./AdminOrders.css";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // State cho Custom Modal
  const [modal, setModal] = useState({
    show: false,
    orderId: null,
    status: "",
    title: "",
    message: "",
  });

  const fetchOrders = () => {
    setLoading(true);
    getAllOrdersAdmin()
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Mở modal xác nhận thay vì dùng window.confirm
  const triggerModal = (orderId, status) => {
    const isCancel = status === "cancelled";
    setModal({
      show: true,
      orderId,
      status,
      title: isCancel ? "Xác nhận hủy đơn" : "Cập nhật trạng thái",
      message: isCancel
        ? `Bạn có chắc chắn muốn hủy đơn hàng #${orderId}? Hành động này không thể hoàn tác.`
        : `Bạn muốn chuyển đơn hàng #${orderId} sang trạng thái "${status}"?`,
    });
  };

  const confirmUpdate = () => {
    const { orderId, status } = modal;
    updateOrderStatusAdmin(orderId, status)
      .then(() => {
        fetchOrders();
        setModal({ ...modal, show: false });
      })
      .catch((err) => alert("Lỗi: " + err.message));
  };

  const statusLabel = (status) => {
    const labels = {
      pending: "Chờ xử lý",
      confirmed: "Đã xác nhận",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return labels[status] || status;
  };

  return (
    <div className="admin-orders-page">
      <header className="page-header">
        <div className="header-left">
          <button
            className="back-btn-premium"
            onClick={() => navigate("/admin/dashboard")}
          >
            ⬅ Dashboard
          </button>
          <h1>📦 Quản lý đơn hàng TIGER SHOP</h1>
        </div>
        <div className="stat-card">
          <span>TỔNG ĐƠN HÀNG</span>
          <strong>{orders.length}</strong>
        </div>
      </header>

      <div className="glass-card order-list-container">
        {loading ? (
          <div className="loader-box">Đang tải dữ liệu...</div>
        ) : (
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày đặt</th>
                  <th className="text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const orderId = o.orderId ?? o.id;
                  return (
                    <tr key={orderId}>
                      <td className="order-id">#{orderId}</td>
                      <td>
                        <span className="email-cell">
                          {o.email || "Khách vãng lai"}
                        </span>
                      </td>
                      <td className="total-cell">
                        {Number(o.total).toLocaleString()} đ
                      </td>
                      <td>
                        <span className={`badge ${o.status}`}>
                          {statusLabel(o.status)}
                        </span>
                      </td>
                      <td>
                        {new Date(o.created_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="text-right">
                        <div className="action-group">
                          {o.status === "pending" && (
                            <>
                              <button
                                className="btn-action confirm"
                                onClick={() =>
                                  triggerModal(orderId, "confirmed")
                                }
                              >
                                Duyệt
                              </button>
                              <button
                                className="btn-action delete"
                                onClick={() =>
                                  triggerModal(orderId, "cancelled")
                                }
                              >
                                Hủy
                              </button>
                            </>
                          )}
                          {o.status === "confirmed" && (
                            <>
                              <button
                                className="btn-action complete"
                                onClick={() =>
                                  triggerModal(orderId, "completed")
                                }
                              >
                                Xong
                              </button>
                              <button
                                className="btn-action delete"
                                onClick={() =>
                                  triggerModal(orderId, "cancelled")
                                }
                              >
                                Hủy
                              </button>
                            </>
                          )}
                          {o.status === "completed" && (
                            <span className="text-success">✔ Thành công</span>
                          )}
                          {o.status === "cancelled" && (
                            <span className="text-muted">✖ Đã hủy</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ CUSTOM MODAL ĐỒNG BỘ GIAO DIỆN (Thay thế localhost says) */}
      {modal.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div
              className={`modal-icon ${modal.status === "cancelled" ? "warn" : "info"}`}
            >
              {modal.status === "cancelled" ? "!" : "?"}
            </div>
            <h3>{modal.title}</h3>
            <p>{modal.message}</p>
            <div className="modal-buttons">
              <button
                className={`btn-confirm ${modal.status}`}
                onClick={confirmUpdate}
              >
                Đồng ý
              </button>
              <button
                className="btn-close"
                onClick={() => setModal({ ...modal, show: false })}
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
