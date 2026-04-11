import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  getProducts,
  addInventoryStock,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
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
  const [payrollRows, setPayrollRows] = useState([]);
  const [probationStaff, setProbationStaff] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingShifts, setPendingShifts] = useState([]);
  const [attendanceIssues, setAttendanceIssues] = useState([]);
  const [payrollMonth, setPayrollMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );


  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [orderData, productData] = await Promise.all([
        getAllOrdersAdmin(),
        getProducts(),
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      
      // Fetch sub-section data
      const [payrollData] = await Promise.all([
        getStaffPayroll(payrollMonth),
      ]);
      const probationData = await getProbationStaff();
      const [reqData, shiftData, issueData] = await Promise.all([
        getPendingStaffRequests(),
        getPendingShifts(),
        getAttendanceIssues(),
      ]);
      
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
      setSuccess("Da cap nhat trang thai ca lam.");
      await loadData();
    } catch (err) {
      setError(err.message || "Khong the cap nhat ca lam");
    }
  };

  const handleFixCheckout = async (id) => {
    try {
      await fixAttendanceCheckout(id);
      setSuccess("Da cap nhat check-out.");
      await loadData();
    } catch (err) {
      setError(err.message || "Khong the chinh check-out");
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
      setError(err.message || "Nhap hang that bai");
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Thẻ 1: Doanh thu */}
              <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Doanh thu tháng</p>
                    <h3 className="text-2xl font-extrabold mt-1">150.000.000đ</h3>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-full text-blue-500">
                    <DollarSign size={24} />
                  </div>
                </div>
              </div>

              {/* Thẻ 2: Đơn hàng */}
              <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Đơn hàng mới</p>
                    <h3 className="text-2xl font-extrabold mt-1">24</h3>
                  </div>
                  <div className="bg-green-50 p-3 rounded-full text-green-500">
                    <ShoppingBag size={24} />
                  </div>
                </div>
              </div>

              {/* Thẻ 3: Hàng tồn */}
              <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Sản phẩm sắp hết</p>
                    <h3 className={`text-2xl font-extrabold mt-1 ${dashboardStats.lowStock > 0 ? 'text-red-500' : ''}`}>
                      {dashboardStats.lowStock}
                    </h3>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-full text-orange-500">
                    <Package size={24} />
                  </div>
                </div>
              </div>

              {/* Thẻ 4: Nhân sự */}
              <div className="bg-white p-6 rounded-lg shadow-md border-b-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Staff đang làm</p>
                    <h3 className="text-2xl font-extrabold mt-1">3/10</h3>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-full text-purple-500">
                    <Users size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KHU VỰC BIỂU ĐỒ (RECHARTS) */}
          {(section === "all" || section === "overview") && (
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              {/* Bên trái: AreaChart Doanh thu */}
              <div className="w-full lg:w-[60%] bg-white p-6 rounded-lg shadow-md min-h-[400px]">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-[#ee4d2d]"></div>
                  Xu hướng doanh thu (7 ngày gần nhất)
                </h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <AreaChart
                      data={[
                        { name: '06/04', revenue: 12000000 },
                        { name: '07/04', revenue: 18000000 },
                        { name: '08/04', revenue: 15000000 },
                        { name: '09/04', revenue: 22000000 },
                        { name: '10/04', revenue: 30000000 },
                        { name: '11/04', revenue: 25000000 },
                        { name: 'Hôm nay', revenue: 35000000 },
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ee4d2d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ee4d2d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000000}M`} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <Tooltip 
                        formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#ee4d2d" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bên phải: PieChart Danh mục */}
              <div className="w-full lg:w-[40%] bg-white p-6 rounded-lg shadow-md min-h-[400px]">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500"></div>
                  Tỷ trọng doanh thu theo Danh mục
                </h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Điện tử', value: 45 },
                          { name: 'Thời trang', value: 30 },
                          { name: 'Đồ ăn', value: 15 },
                          { name: 'Khác', value: 10 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { color: '#ee4d2d' },
                          { color: '#3b82f6' },
                          { color: '#10b981' },
                          { color: '#f59e0b' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {/* KHU VỰC QUẢN LÝ KHO (INVENTORY) */}
          {(section === "inventory") && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h4 className="text-lg font-bold text-gray-800 mb-0">Danh sách sản phẩm / Tồn kho</h4>
                  <div className="flex items-center gap-2">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Tìm ID hoặc Tên SP..."
                      value={productKeyword}
                      onChange={(e) => setProductKeyword(e.target.value)}
                      style={{ width: '200px' }}
                    />
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={lowStockOnly}
                        onChange={(e) => setLowStockOnly(e.target.checked)}
                        id="lowStockCheck"
                      />
                      <label className="form-check-label text-sm" htmlFor="lowStockCheck">
                        Sắp hết hàng
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3 border-0">ID</th>
                        <th className="py-3 border-0">Sản phẩm</th>
                        <th className="py-3 border-0">Giá</th>
                        <th className="py-3 border-0">Tồn kho</th>
                        <th className="py-3 border-0 text-center" style={{ width: 220 }}>Thao tác nhập kho</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-5 text-gray-500">
                            Không tìm thấy sản phẩm nào.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 text-gray-500">#{p.id}</td>
                            <td>
                              <div className="flex items-center gap-3">
                                {p.image_url && (
                                  <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover border" />
                                )}
                                <span className="font-medium text-gray-800">{p.name}</span>
                              </div>
                            </td>
                            <td className="text-orange-600 font-bold">
                              {Number(p.price).toLocaleString()}đ
                            </td>
                            <td>
                              <span className={`badge ${Number(p.stock) <= 10 ? 'bg-danger' : 'bg-success'}`}>
                                {p.stock} {p.unit || 'cái'}
                              </span>
                            </td>
                            <td>
                              <div className="input-group input-group-sm">
                                <input
                                  type="number"
                                  className="form-control text-center"
                                  placeholder="+ Số lượng"
                                  value={stockInput[p.id] || ""}
                                  onChange={(e) => setStockInput({ ...stockInput, [p.id]: e.target.value })}
                                />
                                <button className="btn btn-primary" onClick={() => handleAddStock(p)}>
                                  Lưu
                                </button>
                              </div>
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

          {(section === "orders") && (
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-header bg-white py-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h4 className="text-lg font-bold text-gray-800 mb-0">Quản lý đơn hàng</h4>
                <div className="flex items-center gap-2">
                  <select 
                    className="form-select form-select-sm"
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    style={{ width: '150px' }}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                  <input
                    className="form-control form-control-sm"
                    placeholder="Tìm mã đơn / email..."
                    value={orderKeyword}
                    onChange={(e) => setOrderKeyword(e.target.value)}
                    style={{ width: '200px' }}
                  />
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4">Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Ngày đặt</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-5 text-gray-500">Trống.</td></tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="px-4 font-bold">#{o.id}</td>
                          <td>{o.email || "Khách vãng lai"}</td>
                          <td className="text-orange-600 font-medium">{Number(o.total || 0).toLocaleString()}đ</td>
                          <td>
                            <span className="badge bg-secondary text-uppercase">{o.status}</span>
                          </td>
                          <td>{new Date(o.created_at).toLocaleDateString("vi-VN")}</td>
                          <td className="text-center">
                            <div className="flex justify-center gap-2">
                              {o.status === "pending" && (
                                <>
                                  <button className="btn btn-sm btn-success" onClick={() => handleUpdateOrder(o.id, "confirmed")}>Duyệt</button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleUpdateOrder(o.id, "cancelled")}>Hủy</button>
                                </>
                              )}
                              {o.status === "confirmed" && (
                                <button className="btn btn-sm btn-primary" onClick={() => handleUpdateOrder(o.id, "completed")}>Giao xong</button>
                              )}
                            </div>
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

          {(section === "staff") && (
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3">
              <h4 className="text-lg font-bold text-gray-800 mb-0">Duyệt nhân viên lên chính thức</h4>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4">ID</th>
                      <th>Nhân viên</th>
                      <th>Email</th>
                      <th>Bắt đầu thử việc</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {probationStaff.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-5 text-gray-500">Không có nhân viên thử việc.</td></tr>
                    ) : (
                      probationStaff.map((s) => (
                        <tr key={s.id}>
                          <td className="px-4">#{s.id}</td>
                          <td className="font-medium">{s.name}</td>
                          <td>{s.email}</td>
                          <td>{new Date(s.probation_start_at).toLocaleDateString("vi-VN")}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-success" onClick={() => handleApproveOfficial(s.id)}>Lên chính thức</button>
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


          {(section === "approvals") && (
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white py-3">
                    <h4 className="text-lg font-bold text-gray-800 mb-0">Đơn xin nghỉ / Đến muộn</h4>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="px-3">Staff</th><th>Loại</th><th>Ngày</th><th className="text-center">Duyệt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingRequests.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-4 text-gray-500">Trống.</td></tr>
                          ) : (
                            pendingRequests.map((r) => (
                              <tr key={r.id}>
                                <td className="px-3">{r.staff_name}</td>
                                <td>{r.request_type}</td>
                                <td>{r.request_date}</td>
                                <td className="text-center flex justify-center gap-1">
                                  <button className="btn btn-sm btn-success" onClick={() => handleRequestDecision(r.id, "approved")}>OK</button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleRequestDecision(r.id, "rejected")}>X</button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white py-3">
                    <h4 className="text-lg font-bold text-gray-800 mb-0">Đăng ký ca làm</h4>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th className="px-3">Staff</th><th>Ngày</th><th>Ca</th><th className="text-center">Duyệt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingShifts.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-4 text-gray-500">Trống.</td></tr>
                          ) : (
                            pendingShifts.map((s) => (
                              <tr key={s.id}>
                                <td className="px-3">{s.staff_name}</td>
                                <td>{s.shift_date}</td>
                                <td className="text-sm">{s.start_time}-{s.end_time}</td>
                                <td className="text-center flex justify-center gap-1">
                                  <button className="btn btn-sm btn-success" onClick={() => handleShiftDecision(s.id, "approved")}>OK</button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleShiftDecision(s.id, "rejected")}>X</button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(section === "attendance") && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3">
                <h4 className="text-lg font-bold text-gray-800 mb-0">Ca làm lỗi (Quá 24h chưa check-out)</h4>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4">Staff</th>
                        <th>Check-in lúc</th>
                        <th>Trạng thái</th>
                        <th className="text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceIssues.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-5 text-gray-500">Không có ca lỗi.</td></tr>
                      ) : (
                        attendanceIssues.map((i) => (
                          <tr key={i.id}>
                            <td className="px-4 font-medium">{i.staff_name}</td>
                            <td>{new Date(i.check_in_at).toLocaleString("vi-VN")}</td>
                            <td><span className="badge bg-warning text-dark">{i.status}</span></td>
                            <td className="text-center">
                              <button className="btn btn-sm btn-primary" onClick={() => handleFixCheckout(i.id)}>
                                Chỉnh check-out
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

          {(section === "payroll") && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-800 mb-0">Bảng lương dự kiến</h4>
                  <input
                    type="month"
                    className="form-control form-control-sm w-auto"
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(e.target.value)}
                  />
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4">Nhân viên</th>
                        <th>Tổng giờ</th>
                        <th>Lương/H</th>
                        <th>Tổng lương</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollRows.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-5 text-gray-500">Không có dữ liệu lương.</td></tr>
                      ) : (
                        payrollRows.map((p, idx) => (
                          <tr key={idx}>
                            <td className="px-4 font-medium">{p.staff_name}</td>
                            <td>{p.total_hours}h</td>
                            <td>{Number(p.employment_status === "official" ? p.official_hourly_rate : p.probation_hourly_rate || 0).toLocaleString()}đ</td>
                            <td className="text-orange-600 font-bold">{Number(p.salary_amount || 0).toLocaleString()}đ</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
