import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getOrderStatsAdmin,
  getBestSellingProducts,
  getUncompletedOrders,
} from "../../services/api";
import "./AdminStats.css";

function AdminStats() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
  });

  const [bestProducts, setBestProducts] = useState([]);
  const [uncompleted, setUncompleted] = useState(0);

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
    </div>
  );
}

export default AdminStats;
