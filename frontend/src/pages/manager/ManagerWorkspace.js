import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  getProducts,
  addInventoryStock,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  getStaffPayroll,
  getProbationStaff,
  getPendingStaffRequests,
  decideStaffRequest,
  getPendingShifts,
  getAttendanceIssues,
  fixAttendanceCheckout,
  deleteProduct,
  getOrderStatsAdmin,
  getCategoryRevenueAdmin,
  getCustomerGrowthAdmin,
  directCreateUser,
  getBestSellingProducts,
  getMonthlyRevenueAdmin,
  getVariantsByProductId,
  bulkUpdateVariantStock,
  getStaffPayrollDetail,
  getAllUsersAdmin,
  changeJobInfoAdmin,
  toggleUserStatusAdmin
} from "../../services/api";
import PayslipModal from "../../components/payroll/PayslipModal";
import "./ManagerWorkspace.css";

const COLORS = ["#ee4d2d", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

function ManagerWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes("/manager/inventory")) return "inventory";
    if (path.includes("/manager/orders")) return "orders";
    if (path.includes("/manager/attendance")) return "attendance";
    if (path.includes("/manager/payroll")) return "payroll";
    if (path.includes("/manager/approvals")) return "approvals";
    if (path.includes("/manager/staff")) return "staff";
    return "overview";
  }, [location.pathname]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stockInput, setStockInput] = useState({});
  const [orderStatusFilter] = useState("all");
  const [orderKeyword] = useState("");
  const [productKeyword] = useState("");
  const [lowStockOnly] = useState(false);
  const [payrollRows, setPayrollRows] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [attendanceIssues, setAttendanceIssues] = useState([]);
  const [payrollMonth, setPayrollMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const [allStaff, setAllStaff] = useState([]);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingStaffForm, setEditingStaffForm] = useState({ role_id: 3, probation_hourly_rate: 20000, official_hourly_rate: 25000, status: "active" });
  const [staffModalLoading, setStaffModalLoading] = useState(false);

  // --- Real Stats State ---
  const [statsGlobal, setStatsGlobal] = useState({ totalOrders: 0, totalRevenue: 0, totalCustomers: 0 });
  const [customerGrowthData, setCustomerGrowthData] = useState([]);
  const [categoryRevenueData, setCategoryRevenueData] = useState([]);
  const [payrollStats, setPayrollStats] = useState({ workingCount: 0, estimatedCost: 0 });

  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);

  // --- Modal Add Staff ---
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", phone: "", role_id: 3 });
  const [addStaffError, setAddStaffError] = useState("");

  // --- Modal Variant Stock ---
  const [variantModal, setVariantModal] = useState(null); // { product, variants: [{id, variant_name, stock, newStock}] }
  const [variantModalLoading, setVariantModalLoading] = useState(false);
  const [variantModalError, setVariantModalError] = useState("");

  // --- Modal Phiếu lương ---
  const [payslipData, setPayslipData] = useState(null);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);

  // --- Modal Edit Order ---
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingOrderStatus, setEditingOrderStatus] = useState("");
  const [orderModalLoading, setOrderModalLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [orderData, productData, statsData, growData, catRevData, bestData, monthlyData] = await Promise.all([
        getAllOrdersAdmin(),
        getProducts(),
        getOrderStatsAdmin(),
        getCustomerGrowthAdmin(),
        getCategoryRevenueAdmin(),
        getBestSellingProducts(),
        getMonthlyRevenueAdmin(),
      ]);

      setOrders(Array.isArray(orderData) ? orderData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      setStatsGlobal(statsData);
      setCustomerGrowthData(growData);
      setCategoryRevenueData(catRevData);
      setBestSellingProducts(Array.isArray(bestData) ? bestData : []);
      setMonthlyRevenue(Array.isArray(monthlyData) ? monthlyData : []);
      
      const payrollRes = await getStaffPayroll(payrollMonth);
      if (payrollRes) {
        setPayrollRows(Array.isArray(payrollRes.rows) ? payrollRes.rows : []);
        setPayrollStats(payrollRes.stats || { workingCount: 0, estimatedCost: 0 });
      }

      await getProbationStaff();
      const [reqData, issueData, allUsersData] = await Promise.all([
        getPendingStaffRequests(),
        getAttendanceIssues(),
        getAllUsersAdmin()
      ]);
      await getPendingShifts();
      
      setPendingRequests(Array.isArray(reqData) ? reqData : []);
      setAttendanceIssues(Array.isArray(issueData) ? issueData : []);
      setAllStaff(Array.isArray(allUsersData) ? allUsersData.filter(u => u.role_id === 2 || u.role_id === 3) : []);
      
      setError("");
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [payrollMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderId = String(o.orderId ?? o.id);
      const email = String(o.email || "").toLowerCase();
      const q = orderKeyword.trim().toLowerCase();
      const matchStatus = orderStatusFilter === "all" ? true : o.status === orderStatusFilter;
      const matchKeyword = !q || orderId.includes(q) || email.includes(q);
      return matchStatus && matchKeyword;
    });
  }, [orders, orderStatusFilter, orderKeyword]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = productKeyword.trim().toLowerCase();
      const matchKeyword = !q || (p.name || "").toLowerCase().includes(q) || String(p.id).includes(q);
      const matchLowStock = lowStockOnly ? Number(p.stock || 0) <= 10 : true;
      return matchKeyword && matchLowStock;
    });
  }, [products, productKeyword, lowStockOnly]);

  const handleUpdateOrderFromModal = async () => {
    if (!editingOrder || !editingOrderStatus) return;
    try {
      setOrderModalLoading(true);
      await updateOrderStatusAdmin(editingOrder.orderId || editingOrder.id, editingOrderStatus);
      setSuccess("Cập nhật trạng thái thành công!");
      setEditingOrder(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Không thể cập nhật đơn hàng");
    } finally {
      setOrderModalLoading(false);
    }
  };

  const handleAddStaffDirect = async (e) => {
    e.preventDefault();
    setAddStaffError("");
    try {
      await directCreateUser(newStaff);
      setSuccess("Tạo tài khoản nhân viên mới thành công!");
      setShowAddStaffModal(false);
      setNewStaff({ name: "", email: "", password: "", phone: "", role_id: 3 });
      await loadData();
    } catch (err) {
      setAddStaffError(err.message);
    }
  };

  const handleAddStock = async (product) => {
    const qty = Number(stockInput[product.id] || 0);
    if (!qty || qty <= 0) return;
    try {
      await addInventoryStock({
        product_id: product.id,
        quantity: qty,
        note: "Manager nhập bổ sung tồn kho",
      });
      setStockInput((prev) => ({ ...prev, [product.id]: "" }));
      setSuccess(`Đã nhập thêm ${qty} sản phẩm cho "${product.name}".`);
      await loadData();
    } catch (err) {
      setError(err.message || "Nhập hàng thất bại");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await deleteProduct(id);
      setSuccess("Đã xóa sản phẩm thành công.");
      await loadData();
    } catch (err) {
      setError(err.message || "Xóa sản phẩm thất bại");
    }
  };

  const handleOpenVariantModal = async (product) => {
    setVariantModalError("");
    setVariantModalLoading(true);
    try {
      const variants = await getVariantsByProductId(product.id);
      setVariantModal({
        product,
        variants: variants.map((v) => ({ ...v, newStock: v.stock })),
      });
    } catch (err) {
      setError(err.message || "Không thể tải danh sách phân loại");
    } finally {
      setVariantModalLoading(false);
    }
  };

  const handleVariantStockChange = (variantId, value) => {
    setVariantModal((prev) => ({
      ...prev,
      variants: prev.variants.map((v) =>
        v.id === variantId ? { ...v, newStock: value } : v
      ),
    }));
  };

  const handleSaveVariantStock = async () => {
    if (!variantModal) return;
    setVariantModalError("");
    const updates = variantModal.variants.map((v) => ({
      id: v.id,
      stock: Number(v.newStock) || 0,
    }));
    try {
      await bulkUpdateVariantStock(variantModal.product.id, updates);
      setSuccess(`Đã cập nhật kho tất cả phân loại cho "${variantModal.product.name}" thành công!`);
      setVariantModal(null);
      await loadData();
    } catch (err) {
      setVariantModalError(err.message || "Lỗi cập nhật kho biến thể");
    }
  };

  const handleOpenPayslip = async (staffRow) => {
    setPayslipData(null);
    setShowPayslip(true);
    setPayslipLoading(true);
    try {
      const detail = await getStaffPayrollDetail(staffRow.staff_id, payrollMonth);
      setPayslipData(detail);
    } catch (err) {
      setError(err.message || "Không thể tải phiếu lương");
      setShowPayslip(false);
    } finally {
      setPayslipLoading(false);
    }
  };

  const handleFixCheckout = async (id, time) => {
    try {
      await fixAttendanceCheckout(id, time);
      setSuccess("Đã cập nhật check-out.");
      await loadData();
    } catch (err) {
      setError(err.message || "Không thể chỉnh check-out");
    }
  };

  const handleRequestDecision = async (id, decision) => {
    try {
      await decideStaffRequest(id, { decision });
      setSuccess("Đã cập nhật đơn xin của nhân viên.");
      await loadData();
    } catch (err) {
      setError(err.message || "Không thể duyệt đơn");
    }
  };

  const renderOverview = () => (
    <div className="row g-4">
      <div className="col-md-12">
        <div className="ai-tiger-alert alert d-flex align-items-center mb-4">
          <div className="ai-tiger-avatar me-3">🐯</div>
          <div>
            <h6 className="mb-1 fw-bold">AI Tiger Tư Vấn</h6>
            <p className="mb-0 small">
              Sếp ơi, tháng này Tiger Shop đã đạt <strong>{statsGlobal.totalRevenue?.toLocaleString()}</strong> đ doanh thu. 
              {statsGlobal.totalOrders > 50 ? " Các 'đệ tử' làm việc hăng hái lắm sếp!" : " Sếp nhớ chạy thêm khuyến mại nhé!"}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="col-md-4">
        <div className="card text-center p-4 border-0 shadow-sm">
          <div style={{fontSize:'2rem'}}>💰</div>
          <h6 className="text-muted mt-2">Tổng Doanh Thu</h6>
          <h3 className="fw-bold price-accent">{statsGlobal.totalRevenue?.toLocaleString()} đ</h3>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card text-center p-4 border-0 shadow-sm">
          <div style={{fontSize:'2rem'}}>📦</div>
          <h6 className="text-muted mt-2">Đơn Hàng Thành Công</h6>
          <h3 className="fw-bold text-primary">{statsGlobal.totalOrders}</h3>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card text-center p-4 border-0 shadow-sm">
          <div style={{fontSize:'2rem'}}>👥</div>
          <h6 className="text-muted mt-2">Tổng Số Khách Hàng</h6>
          <h3 className="fw-bold text-success">{statsGlobal.totalCustomers}</h3>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="col-md-8">
        <div className="card p-4 border-0 shadow-sm">
          <h5 className="mb-4 fw-bold">📈 Doanh Thu Theo Tháng</h5>
          {monthlyRevenue.length === 0 ? (
            <div className="text-center text-muted py-5">Chưa có dữ liệu doanh thu</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{fontSize: 12}} />
                <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} tick={{fontSize: 11}} />
                <Tooltip formatter={(v) => `${Number(v).toLocaleString()} đ`} />
                <Legend />
                <Bar dataKey="revenue" fill="#ee4d2d" name="Doanh thu (đ)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Revenue Pie */}
      <div className="col-md-4">
        <div className="card p-4 border-0 shadow-sm">
          <h5 className="mb-4 fw-bold">🥧 Doanh thu Danh mục</h5>
          {categoryRevenueData.length === 0 ? (
            <div className="text-center text-muted py-5">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryRevenueData}
                  dataKey="total_revenue"
                  nameKey="category_name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  label={({category_name, percent}) => `${(percent*100).toFixed(0)}%`}
                >
                  {categoryRevenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v).toLocaleString()} đ`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Customer Growth Chart */}
      <div className="col-md-6">
        <div className="card p-4 border-0 shadow-sm">
          <h5 className="mb-4 fw-bold">📊 Tăng trưởng Khách hàng (Tháng)</h5>
          {customerGrowthData.length === 0 ? (
            <div className="text-center text-muted py-4">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{fontSize: 11}} />
                <YAxis tick={{fontSize: 11}} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="#d1fae5" name="Khách mới" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Best Selling Products */}
      <div className="col-md-6">
        <div className="card p-4 border-0 shadow-sm">
          <h5 className="mb-4 fw-bold">🔥 Top Sản Phẩm Bán Chạy</h5>
          {bestSellingProducts.length === 0 ? (
            <div className="text-center text-muted py-4">Chưa có dữ liệu</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {bestSellingProducts.map((p, idx) => (
                <div key={p.id} className="d-flex align-items-center gap-3">
                  <div className="fw-bold text-muted" style={{width:'24px', textAlign:'center'}}>#{idx+1}</div>
                  <img
                    src={p.image?.startsWith('http') ? p.image : `http://localhost:5000/${p.image}`}
                    alt={p.name}
                    style={{width:'44px', height:'44px', objectFit:'cover', borderRadius:'8px'}}
                  />
                  <div className="flex-fill">
                    <div className="fw-semibold" style={{fontSize:'0.9rem'}}>{p.name}</div>
                    <div className="text-muted" style={{fontSize:'0.8rem'}}>{Number(p.totalSold).toLocaleString()} đơn vị đã bán</div>
                  </div>
                  <div className="badge" style={{background: idx===0?'#ee4d2d': idx===1?'#f59e0b':'#6b7280', color:'white', borderRadius:'20px', padding:'4px 12px'}}>
                    {idx===0?'🥇':idx===1?'🥈':'🥉'} {p.totalSold}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => {
    const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
    return (
      <div className="card border-0 shadow-sm p-4">
        <div className="ai-tiger-alert alert d-flex align-items-center mb-4">
          <div className="ai-tiger-avatar me-3">🐯</div>
          <div>
            <h6 className="mb-1 fw-bold">AI Tiger Nhắc Nhở</h6>
            <p className="mb-0 small">
              {pendingOrdersCount > 0 
                ? `Sếp ơi, còn ${pendingOrdersCount} đơn hàng đang 'treo' chờ sếp phê duyệt đó. Nhanh tay nào sếp!`
                : "Tuyệt vời sếp ơi, không còn đơn hàng nào tồn đọng cả. Sếp quá đỉnh!"}
            </p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="bg-light">
              <tr>
                <th>Mã Đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.orderId || o.id}>
                  <td><strong>#{o.orderId || o.id}</strong></td>
                  <td>
                    <div className="fw-bold">{o.receiver_name}</div>
                    <small className="text-muted">{o.email || o.receiver_phone}</small>
                  </td>
                  <td className="price-accent">{Number(o.total).toLocaleString()} đ</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge bg-${o.status === "completed" ? "success" : o.status === "cancelled" ? "danger" : "warning"}-subtle text-${o.status === "completed" ? "success" : o.status === "cancelled" ? "danger" : "warning"} border px-3`}>
                      {o.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-end">
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setEditingOrder(o);
                        setEditingOrderStatus(o.status);
                      }}
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    const lowStockCount = filteredProducts.filter(p => p.stock < 10).length;
    return (
      <div className="card border-0 shadow-sm p-4">
        <div className="ai-tiger-alert alert d-flex align-items-center mb-4">
          <div className="ai-tiger-avatar me-3">🐯</div>
          <div>
            <h6 className="mb-1 fw-bold">AI Tiger Báo Cáo Kho</h6>
            <p className="mb-0 small">
              {lowStockCount > 0 
                ? `Sếp xem kìa, có ${lowStockCount} món hàng sắp 'cháy kho' rồi, sếp nhập thêm hàng đi!`
                : "Kho hàng ổn định sếp nhé, không có món nào dưới 10 đơn vị."}
            </p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="bg-light">
              <tr>
                <th>Sản phẩm</th>
                <th>Loại hàng</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const hasVariants = p.variants && p.variants.length > 0;
                const isLowStock = Number(p.stock) < 10;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <img 
                          src={p.image?.startsWith('http') ? p.image : 'http://localhost:5000/' + p.image} 
                          alt={p.name} className="rounded me-3" 
                          style={{ width: "48px", height: "48px", objectFit: "cover" }}
                        />
                        <div>
                          <div className="fw-bold">{p.name}</div>
                          <small className="text-muted">#{p.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {hasVariants ? (
                        <span className="badge bg-purple text-white px-2 py-1" style={{background:'#8b5cf6', borderRadius:'6px'}}>
                          📦 Đa phân loại
                        </span>
                      ) : (
                        <span className="badge bg-light text-secondary border px-2 py-1" style={{borderRadius:'6px'}}>
                          🏷️ Đơn lẻ
                        </span>
                      )}
                    </td>
                    <td className="price-accent">{Number(p.price).toLocaleString()} đ</td>
                    <td>
                      {hasVariants ? (
                        /* Đa phân loại: chỉ đọc, hiện tổng */
                        <span className={`badge px-3 py-2 fs-6 ${isLowStock ? 'bg-danger' : 'bg-success'} bg-opacity-10 border ${isLowStock ? 'border-danger text-danger' : 'border-success text-success'}`}>
                          {p.stock} (Tổng) {isLowStock && '⚠️'}
                        </span>
                      ) : (
                        /* Đơn lẻ: nhập trực tiếp */
                        <div className="d-flex align-items-center gap-2">
                          <input 
                            type="number" className="form-control form-control-sm"
                            style={{width: '90px'}}
                            value={stockInput[p.id] !== undefined ? stockInput[p.id] : p.stock}
                            onChange={(e) => setStockInput({...stockInput, [p.id]: e.target.value})}
                            min="0"
                          />
                          {isLowStock && <span title="Sắp hết hàng">⚠️</span>}
                        </div>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        {hasVariants ? (
                          /* Nút Chi tiết phân loại */
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleOpenVariantModal(p)}
                            disabled={variantModalLoading}
                          >
                            🔧 Chi tiết phân loại
                          </button>
                        ) : (
                          /* Nút Cập nhật nhanh */
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleAddStock(p)}
                          >
                            ✅ Cập nhật
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteProduct(p.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStaff = () => (
    <div className="card shadow-sm border-0 p-4">
      <div className="ai-tiger-alert alert d-flex align-items-center mb-4">
        <div className="ai-tiger-avatar me-3">🐯</div>
        <div>
          <h6 className="mb-1 fw-bold">AI Tiger Đồng Hành</h6>
          <p className="mb-0 small">
            Sếp có <strong>{payrollStats.workingCount}</strong> nhân viên đang 'cày' ca hôm nay. Mọi thứ vẫn trong tầm kiểm soát sếp nhé!
          </p>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0">Đội ngũ Nhân viên</h5>
        <button className="btn btn-tiger btn-tiger-primary" onClick={() => setShowAddStaffModal(true)}>
          + Thêm nhân sự mới
        </button>
      </div>
      <div className="row g-4">
        {allStaff.map((s) => (
          <div className="col-md-3" key={s.id}>
            <div className="card p-3 h-100 text-center border-light">
              <div className="mx-auto bg-light rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}>
                👤
              </div>
              <h6 className="fw-bold mb-1">{s.name} <span className={`badge ${s.role_id === 2 ? "bg-warning" : "bg-secondary"}`}>{s.role_id === 2 ? "Manager" : "Staff"}</span></h6>
              <p className="text-muted small mb-3">{s.email}</p>
              <div className="d-flex justify-content-center gap-2">
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    setEditingStaff(s);
                    setEditingStaffForm({
                       role_id: s.role_id,
                       probation_hourly_rate: s.probation_hourly_rate || 20000,
                       official_hourly_rate: s.official_hourly_rate || 25000,
                       status: s.status || (s.is_active ? "active" : "locked")
                    });
                  }}
                >
                  Hồ sơ
                </button>
                <button 
                  className={`btn btn-sm ${s.status === 'locked' || s.is_active === 0 ? "btn-success" : "btn-outline-danger"}`}
                  onClick={async () => {
                    if (window.confirm("Bạn có chắc muốn đổi trạng thái tài khoản này?")) {
                       await toggleUserStatusAdmin(s.id, s.status === 'locked' || s.is_active === 0 ? 1 : 0);
                       loadData();
                    }
                  }}
                >
                  {s.status === 'locked' || s.is_active === 0 ? "Mở Khóa" : "Khóa"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="card shadow-sm border-0 p-4">
      <div className="ai-tiger-alert alert d-flex align-items-center mb-4">
        <div className="ai-tiger-avatar me-3">🐯</div>
        <div>
          <h6 className="mb-1 fw-bold">AI Tiger Kiểm Soát</h6>
          <p className="mb-0 small">
            {attendanceIssues.length > 0
              ? `Cảnh báo sếp, có ${attendanceIssues.length} nhân viên quên Check-out quá 24h rồi kìa!`
              : "Các ca làm việc đều đang diễn ra bình thường sếp ơi."}
          </p>
        </div>
      </div>
      <h5 className="fw-bold mb-4">Chấm công & Ca làm</h5>
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card p-4 border-0 bg-light">
            <h6 className="fw-bold mb-3">Đơn xin nghỉ / Muộn ({pendingRequests.length})</h6>
            {pendingRequests.map(r => (
              <div key={r.id} className="p-2 bg-white rounded border mb-2 d-flex justify-content-between align-items-center">
                <small><strong>{r.staff_name}</strong> - {r.request_type}</small>
                <button className="btn btn-sm btn-primary" onClick={() => handleRequestDecision(r.id, "approved")}>Duyệt</button>
              </div>
            ))}
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-4 border-0 bg-light">
            <h6 className="fw-bold mb-3">Ca lỗi Check-out ({attendanceIssues.length})</h6>
            {attendanceIssues.map(i => (
              <div key={i.id} className="p-2 bg-white rounded border mb-2 d-flex justify-content-between align-items-center">
                <small><strong>{i.staff_name}</strong> - {new Date(i.check_in_at).toLocaleDateString()}</small>
                <button className="btn btn-sm btn-warning" onClick={() => handleFixCheckout(i.id, new Date().toISOString())}>Fix</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayroll = () => (
    <div className="card shadow-sm border-0 p-4">
      <div className="ai-tiger-alert alert d-flex align-items-center mb-4">
        <div className="ai-tiger-avatar me-3">🐯</div>
        <div>
          <h6 className="mb-1 fw-bold">AI Tiger Báo Lương</h6>
          <p className="mb-0 small">
            Sếp ơi, quỹ lương dự kiến cho dàn 'đệ tử' hôm nay là <strong>{payrollStats.estimatedCost?.toLocaleString()}</strong> VNĐ nè sếp.
          </p>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold m-0">Quản lý Bảng lương</h5>
        <input type="month" className="form-control w-auto" value={payrollMonth} onChange={(e) => setPayrollMonth(e.target.value)} />
      </div>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead className="bg-light">
            <tr>
              <th>Nhân viên</th>
              <th>Trạng thái</th>
              <th>Số ngày công</th>
              <th>Tổng giờ làm</th>
              <th>Lương tháng</th>
              <th className="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {payrollRows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4 text-muted">Chưa có dữ liệu lương tháng này</td></tr>
            ) : (
              payrollRows.map(p => (
                <tr key={p.staff_id}>
                  <td>
                    <div className="fw-bold">{p.staff_name}</div>
                    <small className="text-muted">{p.email}</small>
                  </td>
                  <td>
                    <span className={`badge px-3 py-1 ${p.employment_status === 'official' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {p.employment_status === 'official' ? 'Chính thức' : 'Thử việc'}
                    </span>
                  </td>
                  <td>{p.total_days ?? '—'} ngày</td>
                  <td className="text-primary fw-bold">{p.total_hours}h</td>
                  <td className="price-accent fw-bold">{Number(p.salary_amount || 0).toLocaleString()} đ</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleOpenPayslip(p)}
                    >
                      📄 Phiếu lương
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
    <div className="manager-workspace">
      <div className="container py-4">
        <div className="manager-hero d-flex justify-content-between align-items-center">
          <div>
            <h3 className="fw-bold">Tiger Manager Platform</h3>
            <p className="mb-0">Hệ thống quản trị thông minh Tiger Shop - Tối ưu hiệu quả kinh doanh</p>
          </div>
          <div className="d-flex gap-2">
            {["overview", "inventory", "orders", "staff", "attendance", "payroll"].map(tab => (
              <button 
                key={tab} 
                className={`btn btn-sm ${activeTab === tab ? "btn-light text-primary" : "btn-outline-light"}`}
                onClick={() => {
                  if (tab === "overview") navigate("/manager/workspace");
                  else navigate(`/manager/${tab}`);
                }}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Đang tải dữ liệu từ Tiger Server...</p>
          </div>
        ) : (
          <div className="workspace-content">
            {activeTab === "overview" && renderOverview()}
            {activeTab === "inventory" && renderInventory()}
            {activeTab === "orders" && renderOrders()}
            {activeTab === "staff" && renderStaff()}
            {activeTab === "attendance" && renderAttendance()}
            {activeTab === "payroll" && renderPayroll()}
          </div>
        )}
      </div>

      {showAddStaffModal && (
        <div className="modal-overlay">
          <div className="tiger-modal">
            <div className="tiger-modal-header d-flex justify-content-between align-items-center">
              <h4>+ Nhân Viên Mới</h4>
              <button className="btn-close" onClick={() => setShowAddStaffModal(false)}></button>
            </div>
            {addStaffError && <div className="alert alert-danger py-2 small">{addStaffError}</div>}
            <form onSubmit={handleAddStaffDirect}>
              <div className="tiger-form-group">
                <label>Họ và tên</label>
                <input 
                  type="text" className="tiger-input" required 
                  value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                />
              </div>
              <div className="tiger-form-group">
                <label>Email</label>
                <input 
                  type="email" className="tiger-input" required 
                  value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                />
              </div>
              <div className="tiger-form-group">
                <label>Mật khẩu</label>
                <input 
                  type="password" className="tiger-input" required 
                  value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                />
              </div>
              <div className="tiger-form-group">
                <label>Số điện thoại</label>
                <input 
                  type="text" className="tiger-input" 
                  value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                />
              </div>
              <div className="tiger-form-group">
                <label>Chức vụ</label>
                <select 
                  className="tiger-input" 
                  value={newStaff.role_id} onChange={e => setNewStaff({...newStaff, role_id: Number(e.target.value)})}
                >
                  <option value={3}>Staff (Nhân viên)</option>
                  <option value={2}>Manager (Quản lý)</option>
                </select>
              </div>
              <div className="tiger-modal-footer">
                <button type="button" className="btn-tiger btn-tiger-secondary" onClick={() => setShowAddStaffModal(false)}>Hủy</button>
                <button type="submit" className="btn-tiger btn-tiger-primary">Lưu & Kích hoạt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL CHI TIẾT PHÂN LOẠI ===== */}
      {variantModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.classList.contains('modal-overlay')) setVariantModal(null); }}>
          <div className="tiger-modal" style={{maxWidth: '560px', width: '95%'}}>
            <div className="tiger-modal-header d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">📦 Kho Theo Phân Loại</h4>
                <small className="text-muted">{variantModal.product.name}</small>
              </div>
              <button className="btn-close" onClick={() => setVariantModal(null)} />
            </div>

            {variantModalError && (
              <div className="alert alert-danger py-2 small mx-4 mt-3">{variantModalError}</div>
            )}

            <div className="p-4">
              {/* Live total preview */}
              {(() => {
                const newTotal = variantModal.variants.reduce((s, v) => s + (Number(v.newStock) || 0), 0);
                const oldTotal = variantModal.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
                const diff = newTotal - oldTotal;
                return (
                  <div className="d-flex justify-content-between align-items-center bg-light rounded p-3 mb-4">
                    <div>
                      <div className="text-muted small">Tổng tồn kho hiện tại</div>
                      <div className="fw-bold fs-5">{oldTotal} sản phẩm</div>
                    </div>
                    <div className="text-center px-3">→</div>
                    <div className="text-end">
                      <div className="text-muted small">Tổng sau khi cập nhật</div>
                      <div className={`fw-bold fs-5 ${diff > 0 ? 'text-success' : diff < 0 ? 'text-danger' : ''}`}>
                        {newTotal} sản phẩm
                        {diff !== 0 && <span className="fs-6 ms-2">({diff > 0 ? '+' : ''}{diff})</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Variant rows */}
              <div className="d-flex flex-column gap-3">
                {variantModal.variants.map((v) => (
                  <div key={v.id} className="d-flex align-items-center gap-3 p-3 border rounded-3 bg-white">
                    <div className="flex-fill">
                      <div className="fw-semibold">{v.variant_name}</div>
                      <small className="text-muted">Hiện tại: {v.stock} sản phẩm</small>
                    </div>
                    <div style={{width: '130px'}}>
                      <label className="text-muted" style={{fontSize:'0.75rem'}}>Tồn kho mới</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={v.newStock}
                        min="0"
                        onChange={(e) => handleVariantStockChange(v.id, e.target.value)}
                      />
                    </div>
                    <div style={{width:'50px', textAlign:'right'}}>
                      {Number(v.newStock) !== Number(v.stock) && (
                        <span className={`badge ${Number(v.newStock) > Number(v.stock) ? 'bg-success' : 'bg-danger'}`}>
                          {Number(v.newStock) > Number(v.stock) ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tiger-modal-footer">
              <button
                type="button"
                className="btn-tiger btn-tiger-secondary"
                onClick={() => setVariantModal(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-tiger btn-tiger-primary"
                onClick={handleSaveVariantStock}
              >
                💾 Lưu & Cập nhật Kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ===== PAYSLIP MODAL ===== */}
    {showPayslip && (
      <PayslipModal
        data={payslipData}
        loading={payslipLoading}
        onClose={() => { setShowPayslip(false); setPayslipData(null); }}
      />
    )}

    {/* ===== MODAL SỬA ĐƠN HÀNG ===== */}
    {editingOrder && (
      <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-primary text-white border-bottom-0">
              <h5 className="modal-title fw-bold">Trạng thái đơn hàng #{editingOrder.orderId || editingOrder.id}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setEditingOrder(null)}
              ></button>
            </div>
            <div className="modal-body p-4">
              <p className="mb-2 text-muted text-center">Khách hàng: <strong>{editingOrder.receiver_name}</strong></p>
              <div className="mb-4 text-center">
                <span className={`badge bg-${editingOrder.status === "completed" ? "success" : editingOrder.status === "cancelled" ? "danger" : "warning"}-subtle text-${editingOrder.status === "completed" ? "success" : editingOrder.status === "cancelled" ? "danger" : "warning"} px-3 py-2 fs-6`}>
                  Hiện tại: {editingOrder.status.toUpperCase()}
                </span>
              </div>
              <label className="form-label fw-bold">Chọn trạng thái mới</label>
              <select 
                className="form-select form-select-lg mb-3" 
                value={editingOrderStatus}
                onChange={(e) => setEditingOrderStatus(e.target.value)}
              >
                <option value="pending">Chờ xác nhận (Pending)</option>
                <option value="confirmed">Đã xác nhận (Confirmed)</option>
                <option value="shipping">Đang giao hàng (Shipping)</option>
                <option value="completed">Giao thành công (Completed)</option>
                <option value="cancelled">Hủy đơn (Cancelled)</option>
              </select>
            </div>
            <div className="modal-footer bg-light border-top-0 d-flex justify-content-between p-3">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setEditingOrder(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary px-4"
                onClick={handleUpdateOrderFromModal}
                disabled={orderModalLoading || editingOrderStatus === editingOrder.status}
              >
                {orderModalLoading ? "Đang lưu..." : "Lưu Thay Đổi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ===== MODAL STAFF PROFILE ===== */}
    {editingStaff && (
      <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow">
            <div className="modal-header bg-primary text-white border-bottom-0">
              <h5 className="modal-title fw-bold">Hồ sơ công việc: {editingStaff.name}</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setEditingStaff(null)}
              ></button>
            </div>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label text-muted fw-bold">Chức vụ (Role)</label>
                <select 
                  className="form-select"
                  value={editingStaffForm.role_id}
                  onChange={(e) => setEditingStaffForm({...editingStaffForm, role_id: Number(e.target.value)})}
                >
                  <option value={3}>Staff (Nhân viên)</option>
                  <option value={2}>Manager (Quản lý)</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted fw-bold">Mức lương thử việc (VNĐ/Giờ)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={editingStaffForm.probation_hourly_rate} 
                  onChange={e => setEditingStaffForm({...editingStaffForm, probation_hourly_rate: Number(e.target.value)})}
                />
              </div>
              <div className="mb-3">
                <label className="form-label text-muted fw-bold">Mức lương chính thức (VNĐ/Giờ)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={editingStaffForm.official_hourly_rate} 
                  onChange={e => setEditingStaffForm({...editingStaffForm, official_hourly_rate: Number(e.target.value)})}
                />
              </div>
            </div>
            <div className="modal-footer bg-light border-top-0 d-flex justify-content-between p-3">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setEditingStaff(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary px-4"
                disabled={staffModalLoading}
                onClick={async () => {
                  setStaffModalLoading(true);
                  try {
                     await changeJobInfoAdmin(editingStaff.id, {
                        role_id: editingStaffForm.role_id,
                        probation_hourly_rate: editingStaffForm.probation_hourly_rate,
                        official_hourly_rate: editingStaffForm.official_hourly_rate
                     });
                     setSuccess("Cập nhật thông tin công việc thành công!");
                     loadData();
                     setEditingStaff(null);
                  } catch (err) {
                     setError(err.message || "Không thể cập nhật hồ sơ");
                  } finally {
                     setStaffModalLoading(false);
                  }
                }}
              >
                {staffModalLoading ? "Đang lưu..." : "Lưu Thay Đổi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default ManagerWorkspace;
