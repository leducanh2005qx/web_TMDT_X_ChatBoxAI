import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Plus, TrendingUp, Package, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";
import "./AdminDashboard.css";
import { getInventoryAlert, getOrderStatsAdmin, getCategoryRevenueAdmin, getMonthlyRevenueAdmin, getTopProfitProductsAdmin } from "../../services/api";

const COLORS = ["#ee4d2d", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

function AdminDashboard() {
  const [alertData, setAlertData] = useState({ alerts: [], trashCount: 0 });
  const [showTrash, setShowTrash] = useState(false);
  const [trashProducts, setTrashProducts] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [voucherStats, setVoucherStats] = useState({ welcomeCount: 0, birthdayCount: 0, manualCount: 0 });
  
  // Dashboard states
  const [statsGlobal, setStatsGlobal] = useState({ totalOrders: 0, totalRevenue: 0, totalCustomers: 0 });
  const [categoryRevenueData, setCategoryRevenueData] = useState([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [topProfitProducts, setTopProfitProducts] = useState([]);
  
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState("");

  const token = localStorage.getItem("token");

  const loadCategories = useCallback(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const catId = filterCategory || "";
      const [statsRes, catRevRes, monthlyRevRes, topProfitRes, alertRes, vStatsRes] = await Promise.all([
        getOrderStatsAdmin(catId).catch(() => ({ totalOrders: 0, totalRevenue: 0, totalCustomers: 0 })),
        getCategoryRevenueAdmin(catId).catch(() => []),
        getMonthlyRevenueAdmin(catId).catch(() => []),
        getTopProfitProductsAdmin(catId).catch(() => []),
        getInventoryAlert().catch(() => ({ alerts: [], trashCount: 0 })),
        fetch('http://localhost:5000/api/voucher-stats').then(r => r.json()).catch(() => ({ welcomeCount: 0, birthdayCount: 0, manualCount: 0 }))
      ]);

      setStatsGlobal(statsRes);
      setCategoryRevenueData(Array.isArray(catRevRes) ? catRevRes : []);
      setMonthlyRevenueData(Array.isArray(monthlyRevRes) ? monthlyRevRes : []);
      setTopProfitProducts(Array.isArray(topProfitRes) ? topProfitRes : []);
      
      if (alertRes && alertRes.alerts) {
        setAlertData(alertRes);
      } else if (Array.isArray(alertRes)) {
        setAlertData({ alerts: alertRes, trashCount: 0 });
      }
      if (vStatsRes) setVoucherStats(vStatsRes);
    } catch (err) {
      console.error("Lỗi:", err);
    }
  }, [filterCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const deleteProduct = (id) => {
    if (!window.confirm("Xoá sản phẩm này sẽ chuyển vào thùng rác. Bạn chắc chắn?")) return;
    fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Lỗi xóa");
        alert("Đã xóa xong!");
        if (showTrash) loadTrash();
        loadDashboardData();
      })
      .catch((err) => alert(err.message));
  };

  const loadTrash = () => {
    setLoadingTrash(true);
    fetch("http://localhost:5000/api/products?deleted=true", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => setTrashProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi:", err))
      .finally(() => setLoadingTrash(false));
  };

  const handleRestore = (id) => {
    fetch(`http://localhost:5000/api/products/${id}/restore`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Khôi phục thất bại");
        alert("Đã khôi phục sản phẩm!");
        if (showTrash) loadTrash();
        loadDashboardData();
      })
      .catch((err) => alert(err.message));
  };
  const totalRevenue = statsGlobal.totalRevenue || 0;
  const totalCOGS = totalRevenue * 0.65; // Estimated Vốn nhập hàng 65%
  const totalProfit = totalRevenue - totalCOGS; // Lợi nhuận ròng 35%

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-top-bar">
        <div className="header-info">
          <h1 className="main-title">📦 Quản trị kho TIGER SHOP</h1>
        </div>
        <div className="stat-card-mini">
          <span className="stat-label">Tổng đơn hàng</span>
          <span className="stat-value">{statsGlobal.totalOrders || 0}</span>
        </div>
      </div>
      
      {(alertData.alerts.length > 0 || alertData.trashCount > 0) && (
        <div className="card glass-card" style={{ marginBottom: "20px", borderLeft: "5px solid #ffcc00", backgroundColor: "#fffbea" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span style={{ fontSize: "2rem" }}>🐅</span>
            <div>
              <h4 style={{ margin: "0 0 5px 0", color: "#b38f00" }}>Trợ lý Tiger báo cáo:</h4>
              <p style={{ margin: 0, color: "#333", fontSize: "1.1rem" }}>
                Sếp Đức Anh ơi, 
                {alertData.alerts.length > 0 && (
                  <> có <b>{alertData.alerts.length}</b> mặt hàng sắp hết rồi, nhắc Manager nhập thêm đi! ({alertData.alerts.map(p => `${p.name} (còn ${p.stock})`).join(", ")})</>
                )}
                {alertData.trashCount > 0 && (
                  <> {alertData.alerts.length > 0 ? "Ngoài ra còn" : "có"} <b>{alertData.trashCount}</b> sản phẩm đang nằm trong thùng rác, sếp có muốn dọn dẹp hay khôi phục không?</>
                )}
              </p>
              {(voucherStats.welcomeCount > 0 || voucherStats.birthdayCount > 0 || voucherStats.manualCount > 0) && (
                <p style={{ margin: '8px 0 0', color: '#333', fontSize: '1rem', borderTop: '1px dashed #e5e7eb', paddingTop: 8 }}>
                  🎁 <b>Voucher:</b> Hệ thống đã tự tặng <b style={{ color: '#059669' }}>{voucherStats.welcomeCount}</b> mã Welcome cho khách mới
                  {voucherStats.birthdayCount > 0 && <> và <b style={{ color: '#7c3aed' }}>{voucherStats.birthdayCount}</b> mã Sinh nhật</>}.
                  {voucherStats.manualCount > 0 && <> Manager đã tạo <b style={{ color: '#ea580c' }}>{voucherStats.manualCount}</b> mã thủ công. 🐯</>}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {alertData.trashCount > 0 && (
        <button 
          className="btn-trash-toggle" 
          onClick={() => {
            setShowTrash(!showTrash);
            if (!showTrash) loadTrash();
          }}
          style={{ marginBottom: '20px', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: showTrash ? '#eee' : '#fff', cursor: 'pointer' }}
        >
          {showTrash ? '🙈 Đóng thùng rác' : `🗑️ Xem thùng rác (${alertData.trashCount})`}
        </button>
      )}

      {showTrash && (
        <div className="card trash-card" style={{ marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '15px' }}>
          <h3 className="card-title">🗑️ Sản phẩm đã xóa (Soft Delete)</h3>
          {loadingTrash ? <p>Đang tải...</p> : trashProducts.length === 0 ? <p>Thùng rác trống.</p> : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {trashProducts.map(tp => (
                  <tr key={tp.id}>
                    <td><img src={tp.image?.startsWith('http') ? tp.image : `http://localhost:5000/${tp.image}`} alt={tp.name} style={{ width: '40px', borderRadius: '5px' }} /></td>
                    <td>{tp.name}</td>
                    <td>
                      <button className="icon-btn edit" onClick={() => handleRestore(tp.id)}>Khôi phục</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Category Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-center gap-4">
        <label className="font-semibold text-gray-700 whitespace-nowrap">Lọc theo Danh mục:</label>
        <div className="relative w-1/4 min-w-[200px]">
          <Filter className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <select 
            className="w-full pl-10 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[#ee4d2d] bg-white text-gray-700 font-medium"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục (Tổng hợp)</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-500 italic">Khi chọn danh mục, toàn bộ dữ liệu báo cáo bên dưới sẽ tự động cập nhật tương ứng.</div>
      </div>

      {/* 3 Widgets Thống kê lớn */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#3b82f6] flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-semibold mb-1">Tổng doanh thu</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalRevenue.toLocaleString()} ₫</h3>
          </div>
          <div className="bg-blue-50 p-4 rounded-full">
            <DollarSign size={28} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#f59e0b] flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-semibold mb-1">Tổng vốn nhập hàng</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalCOGS.toLocaleString()} ₫</h3>
          </div>
          <div className="bg-amber-50 p-4 rounded-full">
            <Package size={28} className="text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#10b981] flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-semibold mb-1">Lợi nhuận ròng</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalProfit.toLocaleString()} ₫</h3>
          </div>
          <div className="bg-green-50 p-4 rounded-full">
            <TrendingUp size={28} className="text-green-500" />
          </div>
        </div>
      </div>

      {/* Biểu đồ & Bảng Xếp Hạng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Biểu đồ Doanh Thu Theo Tháng */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-xl font-bold mb-6 text-gray-800">
            Biểu đồ Doanh thu (Theo Tháng)
          </h2>
          {monthlyRevenueData.length === 0 ? (
            <div className="text-center text-gray-500 py-10 my-auto">Chưa có dữ liệu doanh thu</div>
          ) : (
            <div style={{ width: "100%", height: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} 
                    tick={{ fontSize: 12, fill: "#6b7280" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip formatter={(v) => `${Number(v).toLocaleString()} đ`} cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Doanh thu" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Top Sản phẩm mang lại Lợi Nhuận */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
            <h2 className="text-xl font-bold mb-4 text-gray-800">🏆 Top 5 Sản phẩm Sinh lời Cao nhất</h2>
            {topProfitProducts.length === 0 ? (
              <div className="text-center text-gray-500 py-10">Chưa có dữ liệu</div>
            ) : (
              <div className="flex flex-col gap-3">
                {topProfitProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="font-bold text-gray-400 w-6 text-center">#{idx + 1}</div>
                    <img
                      src={p.image?.startsWith('http') ? p.image : `http://localhost:5000/${p.image}`}
                      alt={p.name}
                      className="w-12 h-12 object-cover rounded-md border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm truncate">{p.name}</div>
                      <div className="text-xs text-gray-500">Doanh thu: {Number(p.totalSold).toLocaleString()} đ</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#10b981] text-sm">+{Number(p.totalProfit).toLocaleString()} đ</div>
                      <div className="text-xs text-gray-400">Lợi nhuận</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Biểu đồ Tròn Tổng Quan Danh Mục (chỉ hiển thị nếu không bị lọc bởi list) */}
          {!filterCategory && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Tỷ trọng Cơ cấu Doanh thu</h2>
              {categoryRevenueData.length === 0 ? (
                <div className="text-center text-gray-500 py-5">Chưa có dữ liệu</div>
              ) : (
                <div style={{ width: "100%", height: "240px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryRevenueData}
                        dataKey="total_revenue"
                        nameKey="category_name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        labelLine={false}
                        label={({percent}) => `${(percent*100).toFixed(0)}%`}
                      >
                        {categoryRevenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${Number(v).toLocaleString()} đ`} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
