import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getOrderStatsAdmin,
  getBestSellingProducts,
  getUncompletedOrders,
  getCategoryRevenueAdmin
} from "../../services/api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./AdminStats.css";

function AdminStats() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
  });

  const [bestProducts, setBestProducts] = useState([]);
  const [uncompleted, setUncompleted] = useState(0);
  const [categoryRevenue, setCategoryRevenue] = useState([]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6666'];

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await getOrderStatsAdmin();
        setStats({
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
        });

        const best = await getBestSellingProducts();
        setBestProducts(Array.isArray(best) ? best : []);

        const un = await getUncompletedOrders();
        setUncompleted(un.totalUncompleted || 0);

        const catRev = await getCategoryRevenueAdmin();
        setCategoryRevenue(Array.isArray(catRev) ? catRev.map(item => ({ name: item.category_name, value: Number(item.total_revenue) })) : []);
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

      {/* SUMMARY */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Tổng đơn hàng</h3>
          <p>{stats.totalOrders}</p>
        </div>

        <div className="stat-card revenue">
          <h3>Doanh thu (đã giao)</h3>
          <p>{stats.totalRevenue.toLocaleString()} đ</p>
        </div>

        <div className="stat-card warning">
          <h3>Đơn chưa hoàn thành</h3>
          <p>{uncompleted}</p>
        </div>
      </div>

      {/* BEST SELLING */}
      <div className="best-products">
        <h3>🔥 Sản phẩm bán chạy</h3>

        {bestProducts.length === 0 ? (
          <p>Chưa có dữ liệu</p>
        ) : (
          <ul>
            {bestProducts.map((p) => (
              <li key={p.id}>
                <img src={`http://localhost:5000/${p.image}`} alt={p.name} />
                <span>{p.name}</span>
                <b>Đã bán: {p.totalSold}</b>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* REVENUE CHART */}
      <div className="revenue-chart">
        <h3>🍩 Tỷ trọng doanh thu theo Danh mục</h3>
        {categoryRevenue.length === 0 ? (
          <p>Chưa có dữ liệu doanh thu</p>
        ) : (
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
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
    </div>
  );
}

export default AdminStats;
