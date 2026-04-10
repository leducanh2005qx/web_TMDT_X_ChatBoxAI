import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  getProducts,
  addInventoryStock,
  getInventoryLogs,
  getActiveStaff,
  addStaffWorkLog,
  getStaffPayroll,
  getProbationStaff,
  approveOfficialStaff,
  getPendingStaffRequests,
  decideStaffRequest,
  getPendingShifts,
  decideShift,
  getAttendanceIssues,
  fixAttendanceCheckout,
} from "../../services/api";
import "./ManagerWorkspace.css";

function ManagerWorkspace({ section = "all" }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stockInput, setStockInput] = useState({});
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderKeyword, setOrderKeyword] = useState("");
  const [productKeyword, setProductKeyword] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [payrollRows, setPayrollRows] = useState([]);
  const [probationStaff, setProbationStaff] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingShifts, setPendingShifts] = useState([]);
  const [attendanceIssues, setAttendanceIssues] = useState([]);
  const [payrollMonth, setPayrollMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [workForm, setWorkForm] = useState({
    staff_id: "",
    work_date: new Date().toISOString().slice(0, 10),
    hours_worked: "",
    note: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [orderData, productData] = await Promise.all([
        getAllOrdersAdmin(),
        getProducts(),
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      const [logData, staffData, payrollData] = await Promise.all([
        getInventoryLogs(),
        getActiveStaff(),
        getStaffPayroll(payrollMonth),
      ]);
      const probationData = await getProbationStaff();
      const [reqData, shiftData, issueData] = await Promise.all([
        getPendingStaffRequests(),
        getPendingShifts(),
        getAttendanceIssues(),
      ]);
      setInventoryLogs(Array.isArray(logData) ? logData : []);
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setPayrollRows(Array.isArray(payrollData) ? payrollData : []);
      setProbationStaff(Array.isArray(probationData) ? probationData : []);
      setPendingRequests(Array.isArray(reqData) ? reqData : []);
      setPendingShifts(Array.isArray(shiftData) ? shiftData : []);
      setAttendanceIssues(Array.isArray(issueData) ? issueData : []);
      setError("");
    } catch (err) {
      setError(err.message || "Khong the tai du lieu");
    } finally {
      setLoading(false);
    }
  }, [payrollMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dashboardStats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const confirmed = orders.filter((o) => o.status === "confirmed").length;
    const completed = orders.filter((o) => o.status === "completed").length;
    const lowStock = products.filter((p) => Number(p.stock || 0) <= 10).length;
    return { pending, confirmed, completed, lowStock };
  }, [orders, products]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderId = String(o.orderId ?? o.id);
      const email = String(o.email || "").toLowerCase();
      const q = orderKeyword.trim().toLowerCase();
      const matchStatus =
        orderStatusFilter === "all" ? true : o.status === orderStatusFilter;
      const matchKeyword = !q || orderId.includes(q) || email.includes(q);
      return matchStatus && matchKeyword;
    });
  }, [orders, orderStatusFilter, orderKeyword]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = productKeyword.trim().toLowerCase();
      const matchKeyword =
        !q ||
        String(p.name || "")
          .toLowerCase()
          .includes(q) ||
        String(p.id).includes(q);
      const matchLowStock = lowStockOnly ? Number(p.stock || 0) <= 10 : true;
      return matchKeyword && matchLowStock;
    });
  }, [products, productKeyword, lowStockOnly]);

  const handleUpdateOrder = async (id, status) => {
    try {
      await updateOrderStatusAdmin(id, status);
      setSuccess("Cap nhat trang thai don hang thanh cong.");
      await loadData();
    } catch (err) {
      setError(err.message || "Cap nhat don that bai");
    }
  };

  const handleAddStock = async (product) => {
    const qty = Number(stockInput[product.id] || 0);
    if (!qty || qty <= 0) return;

    try {
      await addInventoryStock({
        product_id: product.id,
        quantity: qty,
        note: "Manager nhap bo sung ton kho",
      });
      setStockInput((prev) => ({ ...prev, [product.id]: "" }));
      setSuccess(`Da nhap them ${qty} san pham cho "${product.name}".`);
      await loadData();
    } catch (err) {
      setError(err.message || "Nhap them hang that bai");
    }
  };

  const handleSaveWorkLog = async (e) => {
    e.preventDefault();
    try {
      await addStaffWorkLog(workForm);
      setSuccess("Da luu gio lam cho nhan vien.");
      setWorkForm((prev) => ({ ...prev, hours_worked: "", note: "" }));
      await loadData();
    } catch (err) {
      setError(err.message || "Khong the luu gio lam");
    }
  };

  const handleApproveOfficial = async (staffId) => {
    try {
      await approveOfficialStaff(staffId);
      setSuccess("Da duyet nhan vien len chinh thuc.");
      await loadData();
    } catch (err) {
      setError(err.message || "Khong the duyet len chinh thuc");
    }
  };

  const handleRequestDecision = async (id, decision) => {
    try {
      await decideStaffRequest(id, { decision });
      setSuccess("Da cap nhat don xin cua nhan vien.");
      await loadData();
    } catch (err) {
      setError(err.message || "Khong the duyet don");
    }
  };

  const handleShiftDecision = async (id, decision) => {
    try {
      await decideShift(id, { decision });
      setSuccess("Da cap nhat duyet ca lam.");
      await loadData();
    } catch (err) {
      setError(err.message || "Khong the duyet ca");
    }
  };

  const handleFixCheckout = async (sessionId) => {
    const value = window.prompt("Nhap thoi gian check-out (YYYY-MM-DD HH:mm:ss):");
    if (!value) return;
    try {
      await fixAttendanceCheckout(sessionId, value);
      setSuccess("Da chinh lai check-out thanh cong.");
      await loadData();
    } catch (err) {
      setError(err.message || "Khong the chinh check-out");
    }
  };

  return (
    <div className="manager-workspace">
      <div className="container py-4">
        <div className="manager-hero">
          <h3>Manager Workspace</h3>
          <p>
            Duyet don hang, quan ly ton kho, theo doi luong va danh gia nhan vien thu viec.
          </p>
        </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="alert alert-info">Dang tai du lieu...</div>
      ) : (
        <>
          {(section === "all" || section === "overview") && (
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-warning">
                <div className="card-body">
                  <div className="text-muted">Don cho duyet</div>
                  <h4 className="mb-0">{dashboardStats.pending}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-primary">
                <div className="card-body">
                  <div className="text-muted">Don da xac nhan</div>
                  <h4 className="mb-0">{dashboardStats.confirmed}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-success">
                <div className="card-body">
                  <div className="text-muted">Don hoan thanh</div>
                  <h4 className="mb-0">{dashboardStats.completed}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-danger">
                <div className="card-body">
                  <div className="text-muted">San pham sap het</div>
                  <h4 className="mb-0">{dashboardStats.lowStock}</h4>
                </div>
              </div>
            </div>
          </div>
          )}

          {(section === "all" || section === "orders") && (
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <strong>Quan ly don hang</strong>
            </div>
            <div className="card-body">
              <div className="row g-2 mb-3">
                <div className="col-md-8 d-flex flex-wrap gap-2">
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
                    placeholder="Tim theo ma don / email"
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
                      <th style={{ width: 240 }}>Thao tac</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          Khong co don hang phu hop bo loc.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const orderId = o.orderId ?? o.id;
                        return (
                          <tr key={orderId}>
                            <td>#{orderId}</td>
                            <td>{o.email || "Khach vang lai"}</td>
                            <td>{Number(o.total || 0).toLocaleString()} đ</td>
                            <td>
                              <span className="badge bg-secondary text-uppercase">
                                {o.status}
                              </span>
                            </td>
                            <td>
                              {o.created_at
                                ? new Date(o.created_at).toLocaleDateString("vi-VN")
                                : "-"}
                            </td>
                            <td className="d-flex gap-2">
                              {o.status === "pending" && (
                                <>
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleUpdateOrder(orderId, "confirmed")}
                                  >
                                    Duyet
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleUpdateOrder(orderId, "cancelled")}
                                  >
                                    Huy
                                  </button>
                                </>
                              )}
                              {o.status === "confirmed" && (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleUpdateOrder(orderId, "completed")}
                                >
                                  Danh dau hoan thanh
                                </button>
                              )}
                              {o.status === "completed" && (
                                <span className="text-success">Da hoan thanh</span>
                              )}
                              {o.status === "cancelled" && (
                                <span className="text-muted">Da huy</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}

          {(section === "all" || section === "inventory") && (
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <strong>Quan ly kho va nhap hang</strong>
            </div>
            <div className="card-body">
              <div className="row g-2 mb-3">
                <div className="col-md-8">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Tim san pham theo ten / ID"
                    value={productKeyword}
                    onChange={(e) => setProductKeyword(e.target.value)}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-center">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="lowStockOnly"
                      checked={lowStockOnly}
                      onChange={(e) => setLowStockOnly(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="lowStockOnly">
                      Chi hien san pham ton kho {"<="} 10
                    </label>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 80 }}>ID</th>
                      <th>San pham</th>
                      <th style={{ width: 130 }}>Ton kho</th>
                      <th style={{ width: 130 }}>Gia ban</th>
                      <th style={{ width: 220 }}>Nhap them</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
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
                        <td>{Number(p.price || 0).toLocaleString()} đ</td>
                        <td>
                          <div className="d-flex gap-2">
                            <input
                              type="number"
                              min="1"
                              className="form-control form-control-sm"
                              placeholder="So luong"
                              value={stockInput[p.id] || ""}
                              onChange={(e) =>
                                setStockInput((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleAddStock(p)}
                            >
                              Cap nhat
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}

          {(section === "all" || section === "inventory") && (
          <div className="card shadow-sm mt-4">
            <div className="card-header bg-light">
              <strong>Lich su nhap kho gan day</strong>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 70 }}>ID</th>
                      <th>San pham</th>
                      <th>So luong nhap</th>
                      <th>Ton kho cu -> moi</th>
                      <th>Ghi chu</th>
                      <th>Thoi gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          Chua co lich su nhap kho.
                        </td>
                      </tr>
                    ) : (
                      inventoryLogs.slice(0, 15).map((log) => (
                        <tr key={log.id}>
                          <td>{log.id}</td>
                          <td>{log.product_name}</td>
                          <td>+{log.quantity_added}</td>
                          <td>
                            {log.old_stock} -> {log.new_stock}
                          </td>
                          <td>{log.note || "-"}</td>
                          <td>{new Date(log.created_at).toLocaleString("vi-VN")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )}

          {(section === "all" || section === "payroll") && (
          <div className="card shadow-sm mt-4">
            <div className="card-header bg-light">
              <strong>Cham cong theo gio va tinh luong staff</strong>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveWorkLog} className="row g-2 mb-3">
                <div className="col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={workForm.staff_id}
                    onChange={(e) =>
                      setWorkForm((prev) => ({ ...prev, staff_id: e.target.value }))
                    }
                    required
                  >
                    <option value="">Chon staff</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - {s.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={workForm.work_date}
                    onChange={(e) =>
                      setWorkForm((prev) => ({ ...prev, work_date: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-md-2">
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    className="form-control form-control-sm"
                    placeholder="So gio lam"
                    value={workForm.hours_worked}
                    onChange={(e) =>
                      setWorkForm((prev) => ({ ...prev, hours_worked: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-md-3">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Ghi chu"
                    value={workForm.note}
                    onChange={(e) =>
                      setWorkForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                  />
                </div>
                <div className="col-md-2">
                  <button className="btn btn-sm btn-primary w-100" type="submit">
                    Luu gio lam
                  </button>
                </div>
              </form>

              <div className="d-flex justify-content-end mb-2">
                <input
                  type="month"
                  className="form-control form-control-sm"
                  style={{ width: 180 }}
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                />
              </div>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Staff</th>
                      <th>Email</th>
                      <th>Trang thai</th>
                      <th>Luong thu viec</th>
                      <th>Luong chinh thuc</th>
                      <th>Tong gio ({payrollMonth})</th>
                      <th>Tien luong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted">
                          Chua co du lieu luong.
                        </td>
                      </tr>
                    ) : (
                      payrollRows.map((row) => (
                        <tr key={row.staff_id}>
                          <td>{row.staff_name}</td>
                          <td>{row.email}</td>
                          <td>
                            <span
                              className={`badge ${row.employment_status === "official" ? "bg-success" : "bg-warning text-dark"}`}
                            >
                              {row.employment_status === "official" ? "Chinh thuc" : "Thu viec"}
                            </span>
                          </td>
                          <td>{Number(row.probation_hourly_rate || 0).toLocaleString()} đ</td>
                          <td>{Number(row.official_hourly_rate || 0).toLocaleString()} đ</td>
                          <td>{Number(row.total_hours || 0)}</td>
                          <td className="fw-bold text-success">
                            {Number(row.salary_amount || 0).toLocaleString()} đ
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

          {(section === "all" || section === "staff") && (
          <div className="card shadow-sm mt-4">
            <div className="card-header bg-light">
              <strong>Duyet nhan vien thu viec len chinh thuc (som)</strong>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Nhan vien</th>
                      <th>Email</th>
                      <th>Bat dau thu viec</th>
                      <th>Muc luong thu viec</th>
                      <th style={{ width: 180 }}>Thao tac</th>
                    </tr>
                  </thead>
                  <tbody>
                    {probationStaff.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          Khong co nhan vien nao dang thu viec.
                        </td>
                      </tr>
                    ) : (
                      probationStaff.map((s) => (
                        <tr key={s.id}>
                          <td>{s.id}</td>
                          <td>{s.name}</td>
                          <td>{s.email}</td>
                          <td>
                            {s.probation_start_at
                              ? new Date(s.probation_start_at).toLocaleString("vi-VN")
                              : "-"}
                          </td>
                          <td>{Number(s.probation_hourly_rate || 20000).toLocaleString()} đ/h</td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleApproveOfficial(s.id)}
                            >
                              Duyet len chinh thuc
                            </button>
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

          {(section === "all" || section === "approvals") && (
          <div className="row g-3 mt-2">
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-header bg-light">
                  <strong>Duyet don xin nghi / den muon</strong>
                </div>
                <div className="card-body table-responsive">
                  <table className="table table-sm table-bordered mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Staff</th><th>Loai</th><th>Ngay</th><th>Duyet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.slice(0, 15).map((r) => (
                        <tr key={r.id}>
                          <td>{r.staff_name}</td>
                          <td>{r.request_type}</td>
                          <td>{r.request_date}</td>
                          <td className="d-flex gap-1">
                            <button className="btn btn-sm btn-success" onClick={() => handleRequestDecision(r.id, "approved")}>OK</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleRequestDecision(r.id, "rejected")}>Tu choi</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card shadow-sm">
                <div className="card-header bg-light">
                  <strong>Duyet dang ky ca lam</strong>
                </div>
                <div className="card-body table-responsive">
                  <table className="table table-sm table-bordered mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Staff</th><th>Ngay</th><th>Ca</th><th>Duyet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingShifts.slice(0, 15).map((s) => (
                        <tr key={s.id}>
                          <td>{s.staff_name}</td>
                          <td>{s.shift_date}</td>
                          <td>{s.start_time} - {s.end_time}</td>
                          <td className="d-flex gap-1">
                            <button className="btn btn-sm btn-success" onClick={() => handleShiftDecision(s.id, "approved")}>OK</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleShiftDecision(s.id, "rejected")}>Tu choi</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          )}

          {(section === "all" || section === "attendance") && (
          <div className="card shadow-sm mt-4">
            <div className="card-header bg-light">
              <strong>Ca lam loi (qua 24h chua check-out)</strong>
            </div>
            <div className="card-body table-responsive">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Staff</th>
                    <th>Check-in</th>
                    <th>Trang thai</th>
                    <th>Thao tac</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceIssues.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-muted">Khong co ca loi.</td></tr>
                  ) : (
                    attendanceIssues.map((i) => (
                      <tr key={i.id}>
                        <td>{i.staff_name}</td>
                        <td>{new Date(i.check_in_at).toLocaleString("vi-VN")}</td>
                        <td>{i.status}</td>
                        <td>
                          <button className="btn btn-sm btn-primary" onClick={() => handleFixCheckout(i.id)}>
                            Chinh check-out
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}

export default ManagerWorkspace;
