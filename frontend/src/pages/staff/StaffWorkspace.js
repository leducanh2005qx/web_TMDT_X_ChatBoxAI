import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllOrdersAdmin,
  updateOrderStatus,
  sendOrderInvoice,
  requestOrderRefund,
  getMyAttendanceStatus,
  staffClockIn,
  staffClockOut
} from "../../services/api";
import { 
  Package, 
  Send, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter,
  ChevronRight,
  MoreVertical,
  Mail,
  Smartphone,
  Layout as LayoutIcon,
  User,
  MessageCircle,
  Briefcase
} from "lucide-react";
import StaffSupportCenter from "./StaffSupportCenter";
import StaffPayroll from "./StaffPayroll";
import StaffShifts from "./StaffShifts"; // ✅ NEW
import "./StaffWorkspace.css";

function StaffWorkspace({ section = "dashboard" }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [activeSection, setActiveSection] = useState(section); // orders, support, attendance, payroll
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState("pending");
  const [orderKeyword, setOrderKeyword] = useState("");
  
  // Refund Modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundReason, setRefundReason] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [orderData, attendanceData] = await Promise.all([
        getAllOrdersAdmin(),
        getMyAttendanceStatus()
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setAttendance(attendanceData || null);
    } catch (err) {
      setError("Không thể tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync section prop with activeSection
  useEffect(() => {
    setActiveSection(section);
  }, [section]);

  const handleUpdateStatus = async (id, status, actionName) => {
    if (!window.confirm(`Xác nhận ${actionName} cho đơn hàng #${id}?`)) return;
    setSubmitting(true);
    try {
      await updateOrderStatus(id, status);
      setSuccess(`${actionName} thành công!`);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvoice = async (id) => {
    setSubmitting(true);
    try {
      await sendOrderInvoice(id);
      setSuccess(`Đã gửi hóa đơn đơn hàng #${id} tới email khách hàng.`);
    } catch (err) {
      setError("Lỗi gửi hóa đơn: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRefund = (order) => {
    setSelectedOrder(order);
    setRefundReason("");
    setShowRefundModal(true);
  };

  const handleSubmitRefund = async () => {
    if (!refundReason.trim()) return alert("Vui lòng nhập lý do");
    setSubmitting(true);
    try {
      await requestOrderRefund(selectedOrder.id, refundReason);
      setSuccess("Đã gửi yêu cầu hoàn trả tới Manager.");
      setShowRefundModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockToggle = async () => {
    try {
      if (attendance?.open_session) {
        await staffClockOut();
        setSuccess("Check-out thành công.");
      } else {
        await staffClockIn();
        setSuccess("Check-in thành công.");
      }
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = orderStatusFilter === "all" ? true : o.status === orderStatusFilter;
      const query = orderKeyword.toLowerCase();
      const matchQuery = !query || String(o.id).includes(query) || (o.email && o.email.toLowerCase().includes(query));
      return matchStatus && matchQuery;
    });
  }, [orders, orderStatusFilter, orderKeyword]);

  const renderStatusTag = (status) => {
    switch (status) {
      case 'pending': return <span className="status-tag status-pending">Chờ xử lý</span>;
      case 'confirmed': return <span className="status-tag status-confirmed">Đã soạn</span>;
      case 'shipping': return <span className="status-tag status-shipping">Đang giao</span>;
      case 'completed': return <span className="status-tag status-completed">Hoàn tất</span>;
      case 'cancelled': return <span className="status-tag status-cancelled">Đã hủy</span>;
      default: return <span className="status-tag">{status}</span>;
    }
  };

  const renderOrders = () => (
    <>
      <div className="stats-strip">
        <div className="stat-item">
          <span className="stat-label">Đơn chờ xử lý</span>
          <span className="stat-value">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Đã soạn hôm nay</span>
          <span className="stat-value text-success">{orders.filter(o => o.status === 'confirmed').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Tỷ lệ hoàn tất</span>
          <span className="stat-value text-blue">98%</span>
        </div>
      </div>

      <div className="workspace-controls">
        <div className="filter-group">
          {['pending', 'confirmed', 'shipping', 'all'].map(s => (
            <button 
              key={s} 
              className={`filter-btn ${orderStatusFilter === s ? 'active' : ''}`}
              onClick={() => setOrderStatusFilter(s)}
            >
              {s === 'all' ? 'Tất cả' : renderStatusTag(s)}
            </button>
          ))}
        </div>
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Tìm mã đơn hoặc khách..." 
            value={orderKeyword}
            onChange={(e) => setOrderKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="orders-container">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <p>Tuyệt vời! Không có đơn hàng nào đang chờ.</p>
          </div>
        ) : (
          <>
            <div className="desktop-orders-table">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Khách Hàng</th>
                    <th>Tổng Tiền</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td className="fw-bold">#{order.id}</td>
                      <td>
                        <div className="user-info">
                          <span className="user-name">{order.receiver_name}</span>
                          <span className="user-email">{order.email}</span>
                        </div>
                      </td>
                      <td className="fw-bold">{Number(order.total).toLocaleString()}đ</td>
                      <td>{renderStatusTag(order.status)}</td>
                      <td className="text-end">
                        <div className="action-btns">
                          <button className="btn-action btn-view" onClick={() => navigate(`/orders/${order.id}`)}>
                            <Search size={16} /> Xem
                          </button>
                          {order.status === 'pending' && (
                            <button className="btn-action btn-soan" onClick={() => handleUpdateStatus(order.id, 'confirmed', 'Soạn hàng')}>
                              <Package size={16} /> Soạn
                            </button>
                          )}
                          <button className="btn-action btn-invoice" onClick={() => handleSendInvoice(order.id)}>
                            <Mail size={16} /> Mail
                          </button>
                          <button className="btn-action btn-refund" onClick={() => handleOpenRefund(order)}>
                            <RotateCcw size={16} /> Hoàn
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-orders-grid">
              {filteredOrders.map(order => (
                <div key={order.id} className="order-card-mobile">
                  <div className="card-header">
                    <span className="order-id">Đơn #{order.id}</span>
                    {renderStatusTag(order.status)}
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <User size={14} /> <span>{order.receiver_name}</span>
                    </div>
                    <div className="price-row">
                      <span>Tổng tiền:</span> <span className="price">{Number(order.total).toLocaleString()}đ</span>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button className="mobile-btn mobile-btn-info" onClick={() => navigate(`/orders/${order.id}`)}>
                      <Search size={18} /> Xem
                    </button>
                    {order.status === 'pending' && (
                      <button className="mobile-btn mobile-btn-primary" onClick={() => handleUpdateStatus(order.id, 'confirmed', 'Soạn')}>
                        <Package size={18} /> Soạn
                      </button>
                    )}
                    <button className="mobile-btn mobile-btn-info" onClick={() => handleSendInvoice(order.id)}>
                      <Mail size={18} /> Hóa đơn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );

  const renderDashboard = () => (
    <div className="staff-dashboard-view">
      <div className="stats-grid">
        <div className="dashboard-stat-card">
          <div className="stat-icon pending"><Package size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Đơn hàng mới</span>
            <span className="stat-value">{orders.filter(o => o.status === 'pending').length}</span>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-icon attendance"><Clock size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Trạng thái</span>
            <span className="stat-value text-success">{attendance?.open_session ? "Đang làm" : "Nghỉ"}</span>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-icon processed"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Hàng đã soạn</span>
            <span className="stat-value text-blue">{orders.filter(o => o.status === 'confirmed').length}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-recent-orders mt-4">
        <div className="section-header">
          <h3>📦 Đơn hàng cần xử lý gấp</h3>
          <button className="btn-view-all" onClick={() => setActiveSection("orders")}>Xem tất cả <ChevronRight size={16} /></button>
        </div>
        <div className="mini-orders-list">
          {orders.filter(o => o.status === 'pending').slice(0, 5).map(o => (
            <div key={o.id} className="mini-order-item">
              <div className="order-main">
                <span className="oid">#{o.id}</span>
                <span className="oname">{o.receiver_name}</span>
              </div>
              <div className="order-meta">
                <span className="oprice">{Number(o.total).toLocaleString()}đ</span>
                <button className="btn-quick-confirm" onClick={() => handleUpdateStatus(o.id, 'confirmed', 'Soạn hàng')}>Soạn ngay</button>
              </div>
            </div>
          ))}
          {orders.filter(o => o.status === 'pending').length === 0 && (
            <div className="empty-mini">🎉 Không có đơn hàng tồn đọng!</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="attendance-section card p-4 border-0 shadow-sm rounded-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="m-0 d-flex align-items-center gap-2"><Clock /> Máy Chấm Công</h3>
        <span className={`badge ${attendance?.open_session ? 'bg-success' : 'bg-secondary'}`}>
          {attendance?.open_session ? 'Đang trong ca' : 'Ngoài giờ làm'}
        </span>
      </div>
      
      <div className="clock-display text-center py-5 bg-light rounded-4 mb-4">
        <div className="current-time h1 fw-bold text-primary mb-2">
          {new Date().toLocaleTimeString()}
        </div>
        <p className="text-muted">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="clock-action-large">
        <button 
          className={`btn w-100 py-3 fw-bold rounded-pill shadow-sm transition-all ${attendance?.open_session ? 'btn-danger' : 'btn-success'}`} 
          onClick={handleClockToggle}
          style={{ fontSize: '1.2rem', letterSpacing: '1px' }}
        >
          {attendance?.open_session 
            ? <><RotateCcw size={20} className="me-2" /> KẾT THÚC CA LÀM (CLOCK-OUT)</> 
            : <><CheckCircle size={20} className="me-2" /> BẮT ĐẦU CA LÀM (CLOCK-IN)</>
          }
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-3 border border-blue-100">
        <small className="text-blue-700">
          <Clock size={14} className="me-1" /> <strong>Lưu ý:</strong> Vui lòng Clock-out trước khi ra về để hệ thống tính công chính xác.
        </small>
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="requests-section">
       <h3 className="mb-4 d-flex align-items-center gap-2"><Briefcase /> Lịch sử yêu cầu hoàn trả</h3>
       <div className="alert alert-info border-0 rounded-4 shadow-sm">
         💡 Các yêu cầu hoàn trả của bạn sẽ được Manager xem xét và phê duyệt tại đây.
       </div>
       <p className="text-center text-muted py-5">Đang tải danh sách yêu cầu...</p>
    </div>
  );

  if (loading) return <div className="staff-loading">🐯 Tiger đang chuẩn bị...</div>;

  return (
    <div className="staff-workspace-v2">
      <div className="workspace-header">
        <div className="header-info">
          <h1><LayoutIcon size={24} /> Workspace Nhân Viên</h1>
          <p>Tiger Shop - Trạm xử lý đơn hàng & Tư vấn</p>
        </div>
        <div className="header-actions">
          <div className={`clock-status ${attendance?.open_session ? 'in' : 'out'}`}>
            <Clock size={16} /> <span>{attendance?.open_session ? 'Đang làm' : 'Nghỉ'}</span>
          </div>
        </div>
      </div>

      {error && <div className="workspace-alert alert-error">{error}<button onClick={() => setError("")}>×</button></div>}
      {success && <div className="workspace-alert alert-success">{success}<button onClick={() => setSuccess("")}>×</button></div>}

      <div className="workspace-content">
        {activeSection === "dashboard" && renderDashboard()}
        {activeSection === "orders" && renderOrders()}
        {activeSection === "support" && <StaffSupportCenter />}
        {activeSection === "attendance" && renderAttendance()}
        {activeSection === "shifts" && <StaffShifts />}
        {activeSection === "payroll" && <StaffPayroll />}
        {activeSection === "requests" && renderRequests()}
      </div>

      {showRefundModal && (
        <div className="workspace-modal-overlay">
          <div className="workspace-modal">
            <div className="modal-header">
              <h3>Yêu cầu Hoàn trả #{selectedOrder?.id}</h3>
              <button className="btn-close" onClick={() => setShowRefundModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <textarea 
                placeholder="Lý do (khách boom hàng, hàng lỗi...)"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowRefundModal(false)}>Hủy</button>
              <button className="btn-submit" onClick={handleSubmitRefund} disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffWorkspace;
