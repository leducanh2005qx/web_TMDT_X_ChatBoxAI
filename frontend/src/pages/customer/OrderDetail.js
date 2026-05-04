import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrderById, cancelOrderCustomer, updateOrderStatus } from "../../services/api";
import "./OrderDetail.css";

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = String(user.role || "").toUpperCase();

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
    setCancelling(true);
    try {
      await cancelOrderCustomer(id);
      alert("Đã hủy đơn hàng thành công");
      window.location.reload();
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleUpdateStatus = async (newStatus, actionName) => {
    if (!window.confirm(`Xác nhận ${actionName} cho đơn hàng này?`)) return;
    setConfirming(true);
    try {
      await updateOrderStatus(id, newStatus);
      alert(`${actionName} thành công!`);
      window.location.reload();
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setConfirming(false);
    }
  };

  const renderActionButtons = () => {
    if (!order) return null;
    const status = order.status.toLowerCase();
    const isCustomer = userRole === "CUSTOMER" || userRole === "";
    const isStaff = ["STAFF", "MANAGER", "ADMIN"].includes(userRole);

    return (
      <div className="detail-actions mt-6 flex flex-col gap-3">
        {/* CUSTOMER ACTIONS */}
        {isCustomer && (
          <>
            {status === "pending" && (
              <button 
                className="tiger-btn w-full bg-red-500 hover:bg-red-600 shadow-lg"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "ĐANG HỦY..." : "HỦY ĐƠN HÀNG"}
              </button>
            )}
            {status === "shipping" && (
              <button 
                className="tiger-btn w-full bg-green-500 hover:bg-green-600 shadow-lg"
                onClick={() => handleUpdateStatus("completed", "Đã nhận được hàng")}
                disabled={confirming}
              >
                {confirming ? "ĐANG XỬ LÝ..." : "ĐÃ NHẬN ĐƯỢC HÀNG"}
              </button>
            )}
          </>
        )}

        {/* STAFF / ADMIN ACTIONS */}
        {isStaff && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
             <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Quản lý đơn hàng (Staff Only)</h4>
             <div className="grid grid-cols-1 gap-2">
                {status === "pending" && (
                  <button 
                    className="tiger-btn w-full bg-blue-500 hover:bg-blue-600"
                    onClick={() => handleUpdateStatus("confirmed", "Xác nhận đơn hàng")}
                    disabled={confirming}
                  >
                    XÁC NHẬN ĐƠN
                  </button>
                )}
                {status === "confirmed" && (
                  <button 
                    className="tiger-btn w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => handleUpdateStatus("shipping", "Bắt đầu giao hàng")}
                    disabled={confirming}
                  >
                    GIAO HÀNG
                  </button>
                )}
                {status === "shipping" && (
                  <button 
                    className="tiger-btn w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpdateStatus("completed", "Hoàn tất đơn hàng")}
                    disabled={confirming}
                  >
                    HOÀN TẤT ĐƠN
                  </button>
                )}
                {status !== "cancelled" && status !== "completed" && (
                   <button 
                    className="tiger-btn w-full bg-gray-500 hover:bg-gray-600 mt-2"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    HỦY ĐƠN (QUẢN TRỊ)
                  </button>
                )}
             </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    getOrderById(id)
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => {
        console.error("Lỗi lấy đơn hàng:", err);
        alert("Không lấy được chi tiết đơn hàng");
        navigate("/orders");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Hàm hiển thị Badge trạng thái đơn hàng
  const renderStatus = (status) => {
    const statusMap = {
      pending: { text: "Chờ xử lý", class: "st-pending" },
      confirmed: { text: "Đã xác nhận", class: "st-confirmed" },
      shipping: { text: "Đang giao", class: "st-shipping" },
      completed: { text: "Hoàn tất", class: "st-completed" },
      cancelled: { text: "Đã hủy", class: "st-cancelled" },
    };
    const s = statusMap[status?.toLowerCase()] || {
      text: status,
      class: "st-default",
    };
    return <span className={`premium-status-tag ${s.class}`}>{s.text}</span>;
  };

  // ✅ Hàm hiển thị Phương thức & Trạng thái thanh toán chính xác
  const renderPaymentInfo = (order) => {
    // Đảm bảo lấy đúng giá trị, ép về chữ thường để so sánh
    const method = String(order.payment_method || "cod")
      .toLowerCase()
      .trim();
    const isQR = method === "qr" || method === "banking qr";

    const methodText = isQR ? "Chuyển khoản QR (VietQR)" : "Tiền mặt (COD)";

    // Logic: QR coi như đã trả ngay, COD chỉ tính là đã trả khi đơn hàng "Completed"
    const isPaid = isQR || order.status?.toLowerCase() === "completed";

    return (
      <div className="payment-status-wrapper">
        <div className="info-row">
          <label>Hình thức:</label>
          <span className="method-val">{methodText}</span>
        </div>
        <div className="info-row">
          <label>Tình trạng:</label>
          <span className={`payment-badge ${isPaid ? "paid" : "unpaid"}`}>
            {isPaid ? "✓ Đã thanh toán" : "⚠ Chưa thanh toán"}
          </span>
        </div>
        {renderActionButtons()}
      </div>
    );
  };

  const canReviewByOrderRule = (order) => {
    const method = String(order.payment_method || "cod")
      .toLowerCase()
      .trim();
    if (method === "qr") return true;
    return String(order.status || "").toLowerCase() === "completed";
  };

  if (loading)
    return (
      <div className="order-detail-premium-page">
        <div className="premium-loader">
          <span>✨ TIGER SHOP LOADING...</span>
        </div>
      </div>
    );

  if (!order) return null;

  return (
    <div className="order-detail-premium-page">
      <div className="dynamic-blobs">
        <div className="blob odb-blue"></div>
        <div className="blob odb-purple"></div>
      </div>

      <div className="order-detail-wrapper">
        <header className="detail-header-top">
          <button
            className="back-btn-premium"
            onClick={() => navigate("/orders")}
          >
            ← Quay lại lịch sử
          </button>
          <h2 className="premium-title">
            CHI TIẾT <span>ĐƠN HÀNG #{order?.orderId || order?.id || "N/A"}</span>
          </h2>
        </header>

        <div className="detail-grid-layout">
          {/* CỘT TRÁI: CÁC THÔNG TIN CHUNG */}
          <div className="detail-info-col">
            {/* Ô 1: Trạng thái đơn */}
            <section className="glass-section-card">
              <h3 className="section-label">📋 Trạng thái vận chuyển</h3>
              <div className="status-display-box">
                {renderStatus(order?.status || "Unknown")}
                <p className="order-time-stamp">
                  Ngày đặt: {order?.created_at ? new Date(order.created_at).toLocaleString("vi-VN") : "N/A"}
                </p>
              </div>
            </section>

            {/* Ô 2: Thanh toán */}
            <section className="glass-section-card">
              <h3 className="section-label">💳 Thông tin thanh toán</h3>
              {renderPaymentInfo(order)}
            </section>

            {/* Ô 3: Người nhận */}
            <section className="glass-section-card">
              <h3 className="section-label">👤 Thông tin giao hàng</h3>
              <div className="user-info-group">
                <div className="info-item">
                  <label>Người nhận:</label>
                  <span>{order.receiver_name || "Lê Đình Đức Anh"}</span>
                </div>
                <div className="info-item">
                  <label>Số điện thoại:</label>
                  <span>{order.receiver_phone || "0373271916"}</span>
                </div>
                <div className="info-item">
                  <label>Địa chỉ nhận:</label>
                  <span className="address-text">{order.shipping_address}</span>
                </div>
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: CHI TIẾT SẢN PHẨM */}
          <div className="detail-products-col">
            <section className="glass-section-card product-list-card">
              <h3 className="section-label">📦 Danh sách sản phẩm</h3>
              <div className="order-items-scroll">
                {order?.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div className="order-item-premium-row" key={idx}>
                      <img
                        src={item?.image?.startsWith('http') ? item.image : (item?.image ? `http://localhost:5000/${item.image}` : "https://placehold.co/400x400?text=No+Image")}
                        alt={item?.name || "Sản phẩm"}
                        onError={(e) => (e.target.src = "https://placehold.co/400x400?text=No+Image")}
                      />
                      <div className="item-main-info">
                        <h4>{item?.name || "Sản phẩm Tiger Shop"}</h4>
                        {item?.variant_name && (
                          <span className="variant-badge">
                            {item.variant_name}
                          </span>
                        )}
                        <p className="unit-price">
                          Số lượng: {item?.quantity || 0} ×{" "}
                          {Number(item?.price || 0).toLocaleString()} đ
                        </p>
                      </div>
                      <div className="item-subtotal">
                        {((item?.quantity || 0) * (item?.price || 0)).toLocaleString()} đ
                        <div style={{ marginTop: 8 }}>
                          {canReviewByOrderRule(order) ? (
                            <button
                              className="btn-view-detail"
                              onClick={() => navigate(`/product/${item?.product_id}`)}
                            >
                              Đánh giá
                            </button>
                          ) : (
                            <small className="text-muted">
                              Hoàn tất đơn để đánh giá (COD)
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-order-fallback p-8 text-center text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p>Dữ liệu đơn hàng cũ không còn khả dụng hoặc sản phẩm đã bị xóa khỏi hệ thống.</p>
                  </div>
                )}
              </div>

              <div className="order-financial-summary">
                <div className="summary-line">
                  <span>Tạm tính:</span>
                  <span>
                    {Number(order?.subtotal || order?.total || 0).toLocaleString()} đ
                  </span>
                </div>
                <div className="summary-line">
                  <span>Phí giao hàng:</span>
                  <span>
                    {Number(order?.shipping_fee || 0).toLocaleString()} đ
                  </span>
                </div>
                {order?.discount > 0 && (
                  <div className="summary-line discount-line">
                    <span>Mã giảm giá ({order?.voucher_code || "N/A"}):</span>
                    <span>- {Number(order.discount).toLocaleString()} đ</span>
                  </div>
                )}
                {order?.staff_name && (
                  <div className="summary-line staff-line italic text-gray-400 text-xs mt-2">
                    <span>Nhân viên xử lý: {order.staff_name}</span>
                  </div>
                )}
                <div className="total-divider"></div>
                <div className="grand-total-row">
                  <span>TỔNG CỘNG:</span>
                  <span className="final-price-text">
                    {Number(order?.total || 0).toLocaleString()} đ
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
