import { useCallback, useEffect, useMemo, useState } from "react";
import ShiftSchedule from "../../components/shift/ShiftSchedule";
import {
  getAllOrdersAdmin,
  getProducts,
  getMyAttendanceStatus,
  staffClockIn,
  staffClockOut,
  getMyPayroll,
  createStaffRequest,
  getMyStaffRequests,
} from "../../services/api";
import {
  adminGetThreadMessages,
  adminListThreads,
  adminSendMessage,
} from "../../services/chatApi";
import "./StaffWorkspace.css";

const QUICK_REPLIES = [
  "Shop da nhan duoc yeu cau cua ban, ben em kiem tra va phan hoi ngay.",
  "Don hang cua ban dang duoc xu ly, du kien giao trong 1-3 ngay.",
  "Ban vui long cho em xin ma don hang de em ho tro nhanh hon.",
  "San pham hien con hang. Ban co the dat tren web hoac em gui link ngay.",
  "Neu can doi/tra, ban vui long giu hoa don va san pham nguyen tem.",
];

const threadMetaKey = "staff_thread_meta";

function StaffWorkspace({ section = "all" }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderKeyword, setOrderKeyword] = useState("");
  const [threadKeyword, setThreadKeyword] = useState("");
  const [stockKeyword, setStockKeyword] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [followUpText, setFollowUpText] = useState("");
  const [threadMeta, setThreadMeta] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(threadMetaKey) || "{}");
    } catch {
      return {};
    }
  });
  const [attendance, setAttendance] = useState(null);
  const [clockNow, setClockNow] = useState(Date.now());
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7));
  const [myPayroll, setMyPayroll] = useState(null);
  const [requestForm, setRequestForm] = useState({
    request_type: "late",
    request_date: new Date().toISOString().slice(0, 10),
    minutes_late: 15,
    reason: "",
  });
  const [myStaffRequests, setMyStaffRequests] = useState([]);

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

  const openThread = async (thread) => {
    setSelectedThread(thread);
    setSuccess("");
    try {
      const data = await adminGetThreadMessages(thread.threadId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Khong the tai tin nhan");
    }
  };

  const sendMessage = async () => {
    const content = text.trim();
    if (!content || !selectedThread) return;
    try {
      const orderPrefix = selectedOrderId
        ? `[Ho tro don #${selectedOrderId}] `
        : "";
      await adminSendMessage(selectedThread.threadId, `${orderPrefix}${content}`);
      setText("");
      setSuccess("Da gui tin nhan cho khach.");
      await openThread(selectedThread);
    } catch (err) {
      setError(err.message || "Gui tin that bai");
    }
  };

  const saveThreadMeta = (threadId, updater) => {
    setThreadMeta((prev) => {
      const next = {
        ...prev,
        [threadId]: {
          status: "dang_xu_ly",
          followUp: "",
          ...prev[threadId],
          ...updater,
        },
      };
      localStorage.setItem(threadMetaKey, JSON.stringify(next));
      return next;
    });
  };

  const selectedMeta = selectedThread
    ? threadMeta[selectedThread.threadId] || {}
    : {};

  const setConversationStatus = (status) => {
    if (!selectedThread) return;
    saveThreadMeta(selectedThread.threadId, { status });
    setSuccess("Da cap nhat trang thai hoi thoai.");
  };

  const addFollowUp = () => {
    if (!selectedThread || !followUpText.trim()) return;
    saveThreadMeta(selectedThread.threadId, { followUp: followUpText.trim() });
    setFollowUpText("");
    setSuccess("Da luu ghi chu follow-up.");
  };

  const insertQuickReply = (reply) => {
    setText(reply);
  };

  const escalateToManager = async () => {
    if (!selectedThread) return;
    const content = `[ESCALATE] Vui long Manager/Admin ho tro them cho thread #${selectedThread.threadId}.`;
    try {
      await adminSendMessage(selectedThread.threadId, content);
      setSuccess("Da chuyen yeu cau len cap tren.");
      await openThread(selectedThread);
    } catch (err) {
      setError(err.message || "Khong the escalate");
    }
  };

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

  const filteredThreads = useMemo(() => {
    const query = threadKeyword.trim().toLowerCase();
    return threads.filter((t) => {
      if (!query) return true;
      return (
        String(t.threadId).includes(query) ||
        String(t.email || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [threads, threadKeyword]);

  const filteredProducts = useMemo(() => {
    const query = stockKeyword.trim().toLowerCase();
    return products.filter((p) => {
      if (!query) return true;
      return (
        String(p.id).includes(query) ||
        String(p.name || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [products, stockKeyword]);

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
    <div className="staff-workspace">
      <div className="container py-4">
        <div className="staff-hero">
          <h3>Staff Workspace</h3>
          <p>
            Tu van don hang, chat ho tro khach hang, theo doi ton kho va cham cong realtime.
          </p>
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
        <div className="col-lg-8">
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
                          onClick={() => setSelectedOrderId(String(orderId))}
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

        {(section === "all" || section === "chat") && (
        <div className="col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <strong>Tra loi khach hang (Tiger Chat + Quick Reply)</strong>
            </div>
            <div className="card-body">
              <input
                className="form-control form-control-sm mb-2"
                placeholder="Tim hoi thoai theo thread/email"
                value={threadKeyword}
                onChange={(e) => setThreadKeyword(e.target.value)}
              />
              <div className="mb-2">
                <select
                  className="form-select"
                  value={selectedThread?.threadId || ""}
                  onChange={(e) => {
                    const t = threads.find(
                      (x) => String(x.threadId) === String(e.target.value),
                    );
                    if (t) openThread(t);
                  }}
                >
                  <option value="">Chon hoi thoai</option>
                  {filteredThreads.map((t) => (
                    <option key={t.threadId} value={t.threadId}>
                      #{t.threadId} - {t.email}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="border rounded p-2 mb-2"
                style={{ height: 280, overflowY: "auto", background: "#fafafa" }}
              >
                {messages.map((m) => (
                  <div key={m.id} className="mb-2">
                    <strong>{m.sender_role || m.senderRole}:</strong> {m.message}
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-muted">Chua co tin nhan</div>
                )}
              </div>

              <div className="mb-2 d-flex gap-2 flex-wrap">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => insertQuickReply(reply)}
                  >
                    Mau
                  </button>
                ))}
              </div>

              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  placeholder="Nhap noi dung tu van..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button className="btn btn-primary" onClick={sendMessage}>
                  Gui
                </button>
              </div>

              <div className="mt-3 border-top pt-3">
                <div className="d-flex gap-2 mb-2">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setConversationStatus("cho_phan_hoi")}
                  >
                    Cho phan hoi
                  </button>
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => setConversationStatus("dang_xu_ly")}
                  >
                    Dang xu ly
                  </button>
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={() => setConversationStatus("da_xong")}
                  >
                    Da xong
                  </button>
                </div>
                <div className="small text-muted mb-2">
                  Trang thai hoi thoai:{" "}
                  <strong>{selectedMeta.status || "dang_xu_ly"}</strong>
                </div>
                <div className="d-flex gap-2 mb-2">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Ghi chu follow-up"
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                  />
                  <button className="btn btn-sm btn-dark" onClick={addFollowUp}>
                    Luu
                  </button>
                </div>
                {selectedMeta.followUp && (
                  <div className="small text-muted mb-2">
                    Follow-up: {selectedMeta.followUp}
                  </div>
                )}
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={escalateToManager}
                >
                  Chuyen cap tren
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {(section === "all" || section === "stock") && (
      <div className="row g-3 mt-1">
        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <strong>Tra ton kho nhanh de tu van</strong>
            </div>
            <div className="card-body">
              <input
                className="form-control form-control-sm mb-2"
                placeholder="Tim san pham theo ten / ID"
                value={stockKeyword}
                onChange={(e) => setStockKeyword(e.target.value)}
              />
              <div className="table-responsive" style={{ maxHeight: 240 }}>
                <table className="table table-sm table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>San pham</th>
                      <th>Ton kho</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.slice(0, 20).map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.name}</td>
                        <td>
                          <span
                            className={`badge ${Number(p.stock || 0) <= 10 ? "bg-danger" : "bg-success"}`}
                          >
                            {Number(p.stock || 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <strong>Don dang duoc tu van</strong>
            </div>
            <div className="card-body">
              <div className="mb-2">
                Don da chon:{" "}
                <strong>{selectedOrderId ? `#${selectedOrderId}` : "Chua chon"}</strong>
              </div>
              <p className="text-muted mb-2">
                Bam vao 1 dong don hang ben trai de gan don vao cuoc chat hien tai.
              </p>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSelectedOrderId("")}
              >
                Bo gan don
              </button>
            </div>
          </div>
        </div>
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
              <strong>Luong cua toi</strong>
            </div>
            <div className="card-body">
              <input
                type="month"
                className="form-control form-control-sm mb-2"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
              />
              <div className="small text-muted">Tong gio lam</div>
              <div className="fw-bold mb-2">{Number(myPayroll?.total_hours || 0)} gio</div>
              <div className="small text-muted">Tien luong</div>
              <div className="fw-bold text-success fs-5">
                {Number(myPayroll?.salary_amount || 0).toLocaleString()} đ
              </div>
              <div className="small text-muted mt-2">
                Trang thai: {myPayroll?.employment_status || attendance?.employment_status || "probation"}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {(section === "all" || section === "shifts") && (
        <div style={{ marginTop: 12 }}>
          <ShiftSchedule role="STAFF" />
        </div>
      )}

    </div>
    </div>
  );
}

export default StaffWorkspace;
