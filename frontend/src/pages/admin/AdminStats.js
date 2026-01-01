import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import { getOrderStatsAdmin } from "../../services/api"; // ✅ ĐÚNG TÊN EXPORT
import "./AdminStats.css";

function AdminStats() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getOrderStatsAdmin().then((data) => setStats(data));
  }, []);

  if (!stats) return null;

  return (
    <>
      <Header />

      <div className="stats-page">
        <button
          className="back-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          ⬅ Quay lại Dashboard
        </button>

        <h2>📊 Thống kê đơn hàng</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Tổng đơn hàng</h3>
            <p>{stats.totalOrders}</p>
          </div>

          <div className="stat-card revenue">
            <h3>Tổng doanh thu</h3>
            <p>{Number(stats.totalRevenue).toLocaleString()} đ</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminStats;
