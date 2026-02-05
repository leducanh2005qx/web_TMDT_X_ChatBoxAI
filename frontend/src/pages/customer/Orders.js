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
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => console.error("Không lấy được đơn hàng"))
      .finally(() => setLoading(false));
  }, []);

  const renderStatus = (status) => {
    const statusMap = {
      pending: { text: "Chờ xử lý", class: "status-pending" },
      shipping: { text: "Đang giao", class: "status-shipping" },
      completed: { text: "Đã giao", class: "status-completed" },
      cancelled: { text: "Đã hủy", class: "status-cancelled" },
    };
    const s = statusMap[status.toLowerCase()] || {
      text: status,
      class: "status-default",
    };
    return <span className={`status-badge-premium ${s.class}`}>{s.text}</span>;
  };

  if (loading)
    return (
      <div className="orders-premium-page">
        <div className="premium-loader-container">
          <div className="premium-spinner"></div>
          <p>Đang truy xuất dữ liệu đơn hàng...</p>
        </div>
      </div>
    );

  return (
    <div className="orders-premium-page">
      {/* Nền động đồng bộ hệ thống */}
      <div className="dynamic-blobs">
        <div className="blob ob-blue"></div>
        <div className="blob ob-purple"></div>
      </div>

      <div className="orders-wrapper">
        <header className="orders-header-modern">
          <div className="header-left">
            <h2 className="premium-title">
              LỊCH SỬ <span>ĐƠN HÀNG</span>
            </h2>
            <p className="subtitle">Theo dõi hành trình đơn hàng của bạn</p>
          </div>
          <div className="order-stats-badge">
            Tổng cộng: <b>{orders.length}</b> đơn hàng
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="empty-orders-glass">
            <div className="empty-icon">📦</div>
            <h3>Bạn chưa có giao dịch nào</h3>
            <p>Tiger Shop đang có rất nhiều ưu đãi dành cho bạn.</p>
            <button className="btn-shop-now" onClick={() => navigate("/shop")}>
              KHÁM PHÁ NGAY
            </button>
          </div>
        ) : (
          <div className="orders-table-glass">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Dự kiến giao</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.orderId} className="premium-tr">
                    <td className="order-id">#{o.orderId}</td>
                    <td className="order-date">
                      {new Date(o.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="order-total">
                      {Number(o.total).toLocaleString()} ₫
                    </td>
                    <td className="delivery-date">
                      {o.expected_delivery
                        ? new Date(o.expected_delivery).toLocaleDateString(
                            "vi-VN",
                          )
                        : "Đang cập nhật"}
                    </td>
                    <td>{renderStatus(o.status)}</td>
                    <td className="text-right">
                      <button
                        className="btn-view-detail"
                        onClick={() => navigate(`/orders/${o.orderId}`)}
                      >
                        CHI TIẾT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
