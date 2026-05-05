import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllOrdersAdmin,
  getOrderDetailAdmin,
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
  Briefcase,
  Printer,
  Truck
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

  // View Detail Modal
  const [viewOrder, setViewOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [orderData, attendanceData] = await Promise.all([
        getAllOrdersAdmin(),
        getMyAttendanceStatus()
      ]);
      // ✅ Chuẩn hóa: Backend trả về `orderId` (alias), ta gán lại `id` để dùng thống nhất
      const normalized = (Array.isArray(orderData) ? orderData : []).map(o => ({
        ...o,
        id: o.id || o.orderId,
      }));
      setOrders(normalized);
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
    if (!id) return console.error('Không tìm thấy ID đơn hàng!');
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

  // XEM CHI TIẾT ĐƠN HÀNG (Modal, dùng API Admin)
  const handleViewOrder = async (orderId) => {
    if (!orderId) return console.error('Không tìm thấy ID đơn hàng!');
    setViewLoading(true);
    try {
      const data = await getOrderDetailAdmin(orderId);
      setViewOrder({ ...data, id: data.id || data.orderId });
    } catch (err) {
      setError('Không thể xem chi tiết đơn hàng: ' + err.message);
    } finally {
      setViewLoading(false);
    }
  };

  const handleSendInvoice = async (id) => {
    if (!id) return console.error('Không tìm thấy ID đơn hàng!');
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

  // 🖨️ IN PHIẾU GIAO HÀNG (iframe — không bị trắng xóa)
  const handlePrintInvoice = (order) => {
    if (!order?.id) return;

    // Xóa iframe cũ nếu có
    const old = document.getElementById('tiger-print-frame');
    if (old) old.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'tiger-print-frame';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Phiếu giao hàng #${order.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #222; font-size: 13px; }
    .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 22px; letter-spacing: 3px; margin-bottom: 2px; }
    .header .sub { font-size: 11px; color: #666; }
    .order-code { text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 12px 0; padding: 8px; border: 2px dashed #444; }
    .info-table { width: 100%; margin: 12px 0; }
    .info-table td { padding: 5px 8px; vertical-align: top; }
    .info-table .lbl { font-weight: bold; width: 35%; color: #555; }
    .info-table .addr { font-weight: bold; font-size: 14px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .items-table th { background: #f0f0f0; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 12px; }
    .items-table td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
    .items-table .r { text-align: right; }
    .items-table .c { text-align: center; }
    .total-section { text-align: right; margin: 16px 0; padding-top: 8px; border-top: 2px solid #222; }
    .total-section .grand { font-size: 22px; font-weight: bold; }
    .footer-section { display: flex; justify-content: space-between; margin-top: 40px; }
    .footer-section .col { text-align: center; width: 45%; }
    .footer-section .col .line { margin-top: 50px; border-top: 1px solid #aaa; padding-top: 4px; font-size: 11px; }
    .thanks { text-align: center; margin-top: 24px; font-size: 11px; color: #888; }
    @media print {
      body { padding: 10px; }
      @page { size: A5; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TIGER SHOP</h1>
    <div class="sub">PHIẾU GIAO HÀNG</div>
  </div>

  <div class="order-code">#${order.id}</div>

  <table class="info-table">
    <tr><td class="lbl">Khách hàng:</td><td>${order.receiver_name || 'N/A'}</td></tr>
    <tr><td class="lbl">Số điện thoại:</td><td>${order.receiver_phone || 'N/A'}</td></tr>
    <tr><td class="lbl">Địa chỉ giao:</td><td class="addr">${order.shipping_address || 'N/A'}</td></tr>
    <tr><td class="lbl">Thanh toán:</td><td>${order.payment_method === 'qr' ? 'Chuyển khoản QR' : 'Tiền mặt (COD)'}</td></tr>
    <tr><td class="lbl">Ngày đặt:</td><td>${order.created_at ? new Date(order.created_at).toLocaleDateString('vi-VN') : ''}</td></tr>
    <tr><td class="lbl">Dự kiến giao:</td><td>${order.expected_delivery || 'N/A'}</td></tr>
  </table>

  <table class="items-table">
    <thead>
      <tr>
        <th>STT</th>
        <th>Sản phẩm</th>
        <th class="c">SL</th>
        <th class="r">Đơn giá</th>
        <th class="r">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="c" colspan="5" style="font-style:italic;color:#888;">
          (Chi tiết sản phẩm xem tại đơn hàng online)
        </td>
      </tr>
    </tbody>
  </table>

  <div class="total-section">
    <div class="grand">TỔNG: ${Number(order.total).toLocaleString()}đ</div>
  </div>

  <div class="footer-section">
    <div class="col">
      <strong>Người gửi</strong>
      <div class="line">Tiger Shop Staff</div>
    </div>
    <div class="col">
      <strong>Người nhận</strong>
      <div class="line">(Ký và ghi rõ họ tên)</div>
    </div>
  </div>

  <div class="thanks">Cảm ơn quý khách đã mua sắm tại Tiger Shop! 🐯</div>
</body>
</html>`);
    doc.close();

    // Đợi iframe render xong rồi mới in
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 300);
    };
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
      await requestOrderRefund(selectedOrder.id || selectedOrder.orderId, refundReason);
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
                          <button className="btn-action btn-view" onClick={() => handleViewOrder(order.id)}>
                            <Search size={16} /> Xem
                          </button>
                          {order.status === 'pending' && (
                            <button className="btn-action btn-soan" onClick={() => handleUpdateStatus(order.id, 'confirmed', 'Soạn hàng')}>
                              <Package size={16} /> Soạn
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button className="btn-action btn-ship" onClick={() => handleUpdateStatus(order.id, 'shipping', 'Giao hàng')} style={{background:'#3b82f6',color:'#fff'}}>
                              <Truck size={16} /> Giao
                            </button>
                          )}
                          <button className="btn-action btn-print" onClick={() => handlePrintInvoice(order)} style={{background:'#6366f1',color:'#fff'}}>
                            <Printer size={16} /> In
                          </button>
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
                    <button className="mobile-btn mobile-btn-info" onClick={() => handleViewOrder(order.id)}>
                      <Search size={18} /> Xem
                    </button>
                    {order.status === 'pending' && (
                      <button className="mobile-btn mobile-btn-primary" onClick={() => handleUpdateStatus(order.id, 'confirmed', 'Soạn')}>
                        <Package size={18} /> Soạn
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button className="mobile-btn mobile-btn-primary" onClick={() => handleUpdateStatus(order.id, 'shipping', 'Giao')} style={{background:'#3b82f6'}}>
                        <Truck size={18} /> Giao
                      </button>
                    )}
                    <button className="mobile-btn mobile-btn-info" onClick={() => handlePrintInvoice(order)} style={{background:'#6366f1',color:'#fff'}}>
                      <Printer size={18} /> In phiếu
                    </button>
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

      {/* ========== MODAL XEM CHI TIẾT ĐƠN HÀNG ========== */}
      {(viewOrder || viewLoading) && (
        <div className="workspace-modal-overlay" onClick={() => !viewLoading && setViewOrder(null)}>
          <div className="workspace-modal" style={{maxWidth:560, maxHeight:'85vh', overflow:'auto'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📦 Chi tiết đơn hàng #{viewOrder?.id || '...'}</h3>
              <button className="btn-close" onClick={() => setViewOrder(null)}>×</button>
            </div>
            {viewLoading ? (
              <div className="modal-body" style={{textAlign:'center',padding:40}}>🐯 Đang tải...</div>
            ) : viewOrder && (
              <div className="modal-body" style={{padding:16}}>
                <table style={{width:'100%',borderCollapse:'collapse',marginBottom:12}}>
                  <tbody>
                    <tr><td style={{padding:'6px 8px',fontWeight:'bold',color:'#888',width:'35%'}}>Khách hàng:</td><td style={{padding:'6px 8px'}}>{viewOrder.receiver_name}</td></tr>
                    <tr><td style={{padding:'6px 8px',fontWeight:'bold',color:'#888'}}>SĐT:</td><td style={{padding:'6px 8px'}}>{viewOrder.receiver_phone}</td></tr>
                    <tr><td style={{padding:'6px 8px',fontWeight:'bold',color:'#888'}}>Địa chỉ:</td><td style={{padding:'6px 8px',fontWeight:'bold'}}>{viewOrder.shipping_address}</td></tr>
                    <tr><td style={{padding:'6px 8px',fontWeight:'bold',color:'#888'}}>Trạng thái:</td><td style={{padding:'6px 8px'}}>{renderStatusTag(viewOrder.status)}</td></tr>
                    <tr><td style={{padding:'6px 8px',fontWeight:'bold',color:'#888'}}>Thanh toán:</td><td style={{padding:'6px 8px'}}>{viewOrder.payment_method === 'qr' ? 'Chuyển khoản QR' : 'Tiền mặt (COD)'}</td></tr>
                    <tr><td style={{padding:'6px 8px',fontWeight:'bold',color:'#888'}}>Ngày đặt:</td><td style={{padding:'6px 8px'}}>{viewOrder.created_at ? new Date(viewOrder.created_at).toLocaleString('vi-VN') : 'N/A'}</td></tr>
                  </tbody>
                </table>

                {viewOrder.items && viewOrder.items.length > 0 && (
                  <>
                    <h4 style={{fontSize:14,fontWeight:'bold',margin:'12px 0 8px'}}>🛒 Sản phẩm</h4>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                      <thead>
                        <tr style={{background:'#f5f5f5'}}>
                          <th style={{padding:'6px 8px',textAlign:'left',border:'1px solid #e5e5e5'}}>STT</th>
                          <th style={{padding:'6px 8px',textAlign:'left',border:'1px solid #e5e5e5'}}>Sản phẩm</th>
                          <th style={{padding:'6px 8px',textAlign:'center',border:'1px solid #e5e5e5'}}>SL</th>
                          <th style={{padding:'6px 8px',textAlign:'right',border:'1px solid #e5e5e5'}}>Đơn giá</th>
                          <th style={{padding:'6px 8px',textAlign:'right',border:'1px solid #e5e5e5'}}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewOrder.items.map((item, i) => (
                          <tr key={i}>
                            <td style={{padding:'6px 8px',border:'1px solid #e5e5e5',textAlign:'center'}}>{i+1}</td>
                            <td style={{padding:'6px 8px',border:'1px solid #e5e5e5'}}>{item.name}{item.variant_name ? ` (${item.variant_name})` : ''}</td>
                            <td style={{padding:'6px 8px',border:'1px solid #e5e5e5',textAlign:'center'}}>{item.quantity}</td>
                            <td style={{padding:'6px 8px',border:'1px solid #e5e5e5',textAlign:'right'}}>{Number(item.price).toLocaleString()}đ</td>
                            <td style={{padding:'6px 8px',border:'1px solid #e5e5e5',textAlign:'right',fontWeight:'bold'}}>{(item.quantity * item.price).toLocaleString()}đ</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                <div style={{textAlign:'right',marginTop:12,fontSize:18,fontWeight:'bold',color:'#FF8C00'}}>
                  TỔNG: {Number(viewOrder.total).toLocaleString()}đ
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setViewOrder(null)}>Đóng</button>
              <button className="btn-submit" onClick={() => { handlePrintInvoice(viewOrder); }}>🖨️ In phiếu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffWorkspace;
