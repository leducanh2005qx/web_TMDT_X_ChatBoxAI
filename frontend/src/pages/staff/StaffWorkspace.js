import { useCallback, useEffect, useMemo, useState } from "react";
import ShiftSchedule from "../../components/shift/ShiftSchedule";
import {
  getAllOrdersAdmin,
  getProducts,
  getMyAttendanceStatus,
  staffClockIn,
  staffClockOut,
  getMyPayroll,
  getMyPayrollDetail,
  createStaffRequest,
  getMyStaffRequests,
  updateMe,
} from "../../services/api";
import {
  adminListThreads,
} from "../../services/chatApi";
import PayslipModal from "../../components/payroll/PayslipModal";
import "./StaffWorkspace.css";

function StaffWorkspace({ section = "all" }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [clockNow, setClockNow] = useState(Date.now());
  const [messages] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderKeyword, setOrderKeyword] = useState("");
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [myPayroll, setMyPayroll] = useState(null);
  const [requestForm, setRequestForm] = useState({
    request_type: "late",
    request_date: new Date().toISOString().slice(0, 10),
    minutes_late: 15,
    reason: "",
  });
  const [myStaffRequests, setMyStaffRequests] = useState([]);

  // --- Profile state ---
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);

  // --- Payslip modal ---
  const [payslipData, setPayslipData] = useState(null);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);

  const [orderPage, setOrderPage] = useState(1);
  const orderPageSize = 10;

  const loadOrdersAndThreads = useCallback(async () => {
    try {
      const [orderData, threadData, productData] = await Promise.all([
        getAllOrdersAdmin(),
        adminListThreads(),
        getProducts(),
      ]);
      const [attendanceData, payrollData, staffRequestsData] = await Promise.all([
        getMyAttendanceStatus(),
        getMyPayroll(payrollMonth),
        getMyStaffRequests(),
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setThreads(Array.isArray(threadData) ? threadData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      setAttendance(attendanceData || null);
      setMyPayroll(payrollData || null);
      setMyStaffRequests(Array.isArray(staffRequestsData) ? staffRequestsData : []);
      setError("");
    } catch (err) {
      setError(err.message || "Khong the tai du lieu staff");
    }
  }, [payrollMonth]);

  useEffect(() => {
    loadOrdersAndThreads();
  }, [loadOrdersAndThreads]);

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);




  const handleClockIn = async () => {
    try {
      await staffClockIn();
      setSuccess("Check-in thanh cong.");
      await loadOrdersAndThreads();
    } catch (err) {
      setError(err.message || "Khong the check-in");
    }
  };

  const handleClockOut = async () => {
    try {
      const data = await staffClockOut();
      setSuccess(data.message || "Check-out thanh cong.");
      await loadOrdersAndThreads();
    } catch (err) {
      setError(err.message || "Khong the check-out");
    }
  };

  const handleOpenPayslip = async () => {
    setPayslipData(null);
    setShowPayslip(true);
    setPayslipLoading(true);
    try {
      const detail = await getMyPayrollDetail(payrollMonth);
      setPayslipData(detail);
    } catch (err) {
      setError(err.message || "Không thể tải phiếu lương");
      setShowPayslip(false);
    } finally {
      setPayslipLoading(false);
    }
  };

  const handleOpenProfile = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        setProfileForm({ name: u.name || "", phone: u.phone || "" });
      }
    } catch(e){}
    setShowProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true);
      const data = await updateMe(profileForm);
      setSuccess("Cập nhật hồ sơ thành công!");
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      setShowProfile(false);
    } catch (err) {
      setError(err.message || "Không thể cập nhật hồ sơ");
    } finally {
      setProfileSaving(false);
    }
  };

  const submitLateOrLeave = async (e) => {
    e.preventDefault();
    try {
      await createStaffRequest(requestForm);
      setSuccess("Da gui don thanh cong.");
      setRequestForm((prev) => ({ ...prev, reason: "" }));
      await loadOrdersAndThreads();
    } catch (err) {
      setError(err.message || "Khong the gui don");
    }
  };



  const openSessionSeconds = useMemo(() => {
    const checkInAt = attendance?.open_session?.check_in_at;
    if (!checkInAt) return 0;
    const diff = Math.floor((clockNow - new Date(checkInAt).getTime()) / 1000);
    return diff > 0 ? diff : 0;
  }, [attendance, clockNow]);

  const formatSeconds = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // shiftsByDate removed – now handled by ShiftSchedule component

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderId = String(o.orderId ?? o.id);
      const email = String(o.email || "").toLowerCase();
      const query = orderKeyword.trim().toLowerCase();
      const matchStatus =
        orderStatusFilter === "all" ? true : o.status === orderStatusFilter;
      const matchQuery = !query || orderId.includes(query) || email.includes(query);
      return matchStatus && matchQuery;
    });
  }, [orders, orderKeyword, orderStatusFilter]);

  const pagedOrders = useMemo(() => {
    const start = (orderPage - 1) * orderPageSize;
    return filteredOrders.slice(start, start + orderPageSize);
  }, [filteredOrders, orderPage]);

  const totalOrderPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / orderPageSize),
  );


  const todaySummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const sentToday = messages.filter((m) => {
      const isStaff = String(m.sender_role || m.senderRole).toUpperCase() === "ADMIN";
      const createdAt = m.created_at || m.createdAt;
      if (!createdAt) return false;
      return isStaff && String(createdAt).slice(0, 10) === today;
    }).length;
    return {
      totalThreads: threads.length,
      sentToday,
      lowStockCount: products.filter((p) => Number(p.stock || 0) <= 10).length,
    };
  }, [messages, threads, products]);

  return (
    <>
    <div className="staff-workspace">
      <div className="container py-4">
        <div className="staff-hero d-flex justify-content-between align-items-center">
          <div>
            <h3>Staff Workspace</h3>
            <p className="mb-0">
              Tu van don hang, ho tro khach hang, theo doi ton kho va cham cong realtime.
            </p>
          </div>
          <button className="btn btn-outline-light" onClick={handleOpenProfile}>
            👤 Hồ sơ cá nhân
          </button>
        </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {(section === "all" || section === "attendance") && (
      <div className="card shadow-sm mb-3">
        <div className="card-header bg-light">
          <strong>Cham cong theo thoi gian thuc</strong>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-3">
              <div>
                <div className="text-muted small">Trang thai nhan su</div>
                <span
                  className={`badge ${attendance?.employment_status === "official" ? "bg-success" : "bg-warning text-dark"}`}
                >
                  {attendance?.employment_status === "official" ? "Chinh thuc" : "Thu viec"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="text-muted small">Luong thu viec</div>
              <strong>{Number(attendance?.probation_hourly_rate || 20000).toLocaleString()} đ/h</strong>
            </div>
            <div className="col-md-3">
              <div className="text-muted small">Luong chinh thuc</div>
              <strong>{Number(attendance?.official_hourly_rate || 25000).toLocaleString()} đ/h</strong>
            </div>
            <div className="col-md-3">
              <div className="text-muted small">Thoi gian ca hien tai</div>
              <strong>{formatSeconds(openSessionSeconds)}</strong>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button
              className="btn btn-success"
              onClick={handleClockIn}
              disabled={Boolean(attendance?.open_session)}
            >
              Check-in
            </button>
            <button
              className="btn btn-danger"
              onClick={handleClockOut}
              disabled={!attendance?.open_session}
            >
              Check-out
            </button>
          </div>
          <p className="text-muted small mt-2 mb-0">
            Thu viec tinh 20.000 đ/gio. Khi len chinh thuc tinh 25.000 đ/gio. Tu dong len chinh thuc sau du 3 ngay lam hoac duoc Manager duyet som.
          </p>
        </div>
      </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card border-primary">
            <div className="card-body">
              <div className="text-muted">Hoi thoai dang phu trach</div>
              <h5 className="mb-0">{todaySummary.totalThreads}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-success">
            <div className="card-body">
              <div className="text-muted">Tin nhan da gui hom nay</div>
              <h5 className="mb-0">{todaySummary.sentToday}</h5>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-danger">
            <div className="card-body">
              <div className="text-muted">San pham sap het hang</div>
              <h5 className="mb-0">{todaySummary.lowStockCount}</h5>
            </div>
          </div>
        </div>
      </div>

      {(section === "all" || section === "orders" || section === "chat") && (
      <div className="row g-3">
        {(section === "all" || section === "orders") && (
        <div className="col-lg-12">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <strong>Danh sach don hang (chi xem + loc nhanh)</strong>
            </div>
            <div className="card-body">
              <div className="row g-2 mb-2">
                <div className="col-md-8 d-flex gap-2 flex-wrap">
                  {["all", "pending", "confirmed", "completed", "cancelled"].map(
                    (status) => (
                      <button
                        key={status}
                        className={`btn btn-sm ${orderStatusFilter === status ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => setOrderStatusFilter(status)}
                      >
                        {status === "all" ? "Tat ca" : status}
                      </button>
                    ),
                  )}
                </div>
                <div className="col-md-4">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Tim ma don / email"
                    value={orderKeyword}
                    onChange={(e) => setOrderKeyword(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 90 }}>Ma don</th>
                      <th>Khach hang</th>
                      <th>Tong tien</th>
                      <th>Trang thai</th>
                      <th>Ngay dat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedOrders.map((o) => {
                      const orderId = o.orderId ?? o.id;
                      return (
                        <tr
                          key={orderId}
                          style={{ cursor: "pointer" }}
                        >
                          <td>#{orderId}</td>
                          <td>{o.email || "Khach vang lai"}</td>
                          <td>{Number(o.total || 0).toLocaleString()} đ</td>
                          <td>{o.status}</td>
                          <td>
                            {o.created_at
                              ? new Date(o.created_at).toLocaleDateString("vi-VN")
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className="text-muted">
                  Trang {orderPage}/{totalOrderPages} - {filteredOrders.length} don
                </small>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={orderPage <= 1}
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  >
                    Truoc
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={orderPage >= totalOrderPages}
                    onClick={() =>
                      setOrderPage((p) => Math.min(totalOrderPages, p + 1))
                    }
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}


      </div>
      )}



      {(section === "all" || section === "requests" || section === "shifts" || section === "payroll") && (
      <div className="row g-3 mt-1">
        {(section === "all" || section === "requests") && (
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <strong>Xin den muon / xin nghi</strong>
            </div>
            <div className="card-body">
              <form onSubmit={submitLateOrLeave} className="row g-2">
                <div className="col-12">
                  <select
                    className="form-select form-select-sm"
                    value={requestForm.request_type}
                    onChange={(e) =>
                      setRequestForm((prev) => ({ ...prev, request_type: e.target.value }))
                    }
                  >
                    <option value="late">Xin den muon</option>
                    <option value="leave">Xin nghi</option>
                  </select>
                </div>
                <div className="col-6">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={requestForm.request_date}
                    onChange={(e) =>
                      setRequestForm((prev) => ({ ...prev, request_date: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-6">
                  <input
                    type="number"
                    min="0"
                    className="form-control form-control-sm"
                    value={requestForm.minutes_late}
                    onChange={(e) =>
                      setRequestForm((prev) => ({ ...prev, minutes_late: e.target.value }))
                    }
                    disabled={requestForm.request_type !== "late"}
                  />
                </div>
                <div className="col-12">
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    placeholder="Ly do"
                    value={requestForm.reason}
                    onChange={(e) =>
                      setRequestForm((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-12">
                  <button className="btn btn-sm btn-primary w-100" type="submit">
                    Gui don
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        )}




        {(section === "all" || section === "payroll") && (
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <strong>💰 Lương của tôi</strong>
            </div>
            <div className="card-body">
              <input
                type="month"
                className="form-control form-control-sm mb-3"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
              />
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Tổng giờ làm</span>
                <strong>{Number(myPayroll?.total_hours || 0)}h</strong>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted small">Tiền lương</span>
                <strong className="text-success">{Number(myPayroll?.salary_amount || 0).toLocaleString()} đ</strong>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted small">Trạng thái</span>
                <span className={`badge ${myPayroll?.employment_status === 'official' ? 'bg-success' : 'bg-warning text-dark'}`}>
                  {myPayroll?.employment_status === 'official' ? 'Chính thức' : 'Thử việc'}
                </span>
              </div>
              <button
                className="btn btn-primary btn-sm w-100"
                onClick={handleOpenPayslip}
              >
                📄 Xem Phếu Lương Chi Tiết
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {(section === "all" || section === "shifts") && (
        <div style={{ marginTop: 12 }}>
          <ShiftSchedule role="STAFF" />
          
          <div className="card shadow-sm mt-3">
            <div className="card-header bg-white">
              <strong>Lịch sử yêu cầu của tôi</strong>
            </div>
            <div className="card-body p-0">
               <table className="table table-sm table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Loại</th>
                      <th>Ngày</th>
                      <th>Lý do</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myStaffRequests.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-3 text-muted">Chưa có yêu cầu nào</td></tr>
                    ) : (
                      myStaffRequests.map(r => (
                        <tr key={r.id}>
                          <td>{r.request_type}</td>
                          <td>{new Date(r.request_date).toLocaleDateString()}</td>
                          <td>{r.reason}</td>
                          <td>
                            <span className={`badge bg-${r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}`}>
                              {r.status === 'approved' ? 'Đã duyệt' : r.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>

    {/* Payslip modal */}
    {showPayslip && (
      <PayslipModal
        data={payslipData}
        loading={payslipLoading}
        onClose={() => { setShowPayslip(false); setPayslipData(null); }}
      />
    )}

    {showProfile && (
      <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title fw-bold">Chỉnh sửa Hồ sơ cá nhân</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowProfile(false)}></button>
            </div>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label text-muted fw-bold">Tên hiển thị</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.name} 
                  onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-muted fw-bold">Số điện thoại</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={profileForm.phone} 
                  onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                />
              </div>
              <div className="alert alert-info py-2 small mb-0">
                Lưu ý: Bạn không thể tự sửa chức vụ, mức lương, hay email tài khoản. Nếu cần thay đổi, vui lòng liên hệ Quản lý.
              </div>
            </div>
            <div className="modal-footer bg-light border-top-0">
              <button className="btn btn-outline-secondary" onClick={() => setShowProfile(false)}>Đóng</button>
              <button 
                className="btn btn-primary px-4" 
                onClick={handleSaveProfile} 
                disabled={profileSaving}
              >
                {profileSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default StaffWorkspace;
