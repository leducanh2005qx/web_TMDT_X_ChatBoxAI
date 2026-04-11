import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getOrderStatsAdmin,
  getBestSellingProducts,
  getUncompletedOrders,
  getCategoryRevenueAdmin,
  getMonthlyRevenueAdmin,
  getWeeklyRevenueAdmin
} from "../../services/api";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import "./AdminStats.css";

function AdminStats() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
  });

  const [bestProducts, setBestProducts] = useState([]);
  const [uncompleted, setUncompleted] = useState(0);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6666'];

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, best, un, catRev, monthly, weekly] = await Promise.all([
          getOrderStatsAdmin(),
          getBestSellingProducts(),
          getUncompletedOrders(),
          getCategoryRevenueAdmin(),
          getMonthlyRevenueAdmin(),
          getWeeklyRevenueAdmin()
        ]);

        setStats({
          totalOrders: statsData.totalOrders || 0,
          totalRevenue: statsData.totalRevenue || 0,
        });
        setBestProducts(Array.isArray(best) ? best : []);
        setUncompleted(un.totalUncompleted || 0);
        setCategoryRevenue(Array.isArray(catRev) ? catRev.map(item => ({ name: item.category_name, value: Number(item.total_revenue) })) : []);
        setMonthlyData(Array.isArray(monthly) ? monthly : []);
        setWeeklyData(Array.isArray(weekly) ? weekly : []);
      } catch (err) {
        console.error("STATS ERROR:", err);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="stats-page">
      <button className="back-btn" onClick={() => navigate("/admin/dashboard")}>
        ⬅ Quay lại Dashboard
      </button>

      <h2>📊 Thống kê đơn hàng</h2>
      <p className="subtitle">Báo cáo tình hình kinh doanh của Tiger Shop</p>

      {/* SUMMARY */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <h3>Tổng đơn hàng</h3>
          <p>{stats.totalOrders}</p>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <h3>Doanh thu (đã giao)</h3>
          <p>{stats.totalRevenue.toLocaleString()} đ</p>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <h3>Đơn chưa hoàn thành</h3>
          <p>{uncompleted}</p>
        </div>
      </div>

      {/* REVENUE TRENDS */}
      <div className="charts-container">
        <div className="revenue-chart main-chart">
          <h3>📈 Xu hướng doanh thu theo Tháng</h3>
          {monthlyData.length === 0 ? (
            <p className="no-data">Chưa có dữ liệu theo tháng</p>
          ) : (
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ee4d2d" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ee4d2d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(val) => `${val / 1000000}M`} />
                  <Tooltip formatter={(val) => `${Number(val).toLocaleString()} đ`} />
                  <Area type="monotone" dataKey="revenue" stroke="#ee4d2d" fillOpacity={1} fill="url(#colorMonthly)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="revenue-chart main-chart">
          <h3>📅 Doanh thu theo Tuần</h3>
          {weeklyData.length === 0 ? (
            <p className="no-data">Chưa có dữ liệu theo tuần</p>
          ) : (
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00c49f" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00c49f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip formatter={(val) => `${Number(val).toLocaleString()} đ`} />
                  <Area type="monotone" dataKey="revenue" stroke="#00c49f" fillOpacity={1} fill="url(#colorWeekly)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="charts-flex">
        {/* CATEGORY REVENUE CHART */}
        <div className="revenue-chart half-chart">
          <h3>🍩 Tỷ trọng doanh thu theo Danh mục</h3>
          {categoryRevenue.length === 0 ? (
            <p className="no-data">Chưa có dữ liệu doanh thu</p>
          ) : (
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryRevenue}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryRevenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} đ`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* BEST SELLING */}
        <div className="best-products half-chart">
          <h3>🔥 Top 5 sản phẩm bán chạy</h3>
          {bestProducts.length === 0 ? (
            <p className="no-data">Chưa có dữ liệu</p>
          ) : (
            <ul className="best-list">
              {bestProducts.map((p) => (
                <li key={p.id} className="best-item">
                  <div className="item-info">
                    <img src={p.image?.startsWith('http') ? p.image : `http://localhost:5000/${p.image}`} alt={p.name} />
                    <span>{p.name}</span>
                  </div>
                  <div className="item-sold">
                    <b>Đã bán: {p.totalSold}</b>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminStats;
