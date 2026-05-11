import { NavLink, useNavigate } from "react-router-dom";
import UserMenu from "../common/UserMenu";
import "./AdminHeader.css";

function AdminHeader() {
  const navigate = useNavigate();


  return (
    <header className="admin-header">
      {/* LEFT */}
      <div className="admin-left">
        <div
          className="admin-brand"
          onClick={() => navigate("/admin/dashboard")}
        >
          <span className="logo-icon">🐯</span>
          <div className="brand-text">
            <span className="logo-text">TIGER SHOP</span>
            <span className="logo-sub">Admin Panel</span>
          </div>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/dashboard">Tổng quan</NavLink>
          <NavLink to="/admin/stats">Biểu đồ Doanh thu</NavLink>
          <NavLink to="/admin/users">Quản lý Tài khoản</NavLink>
          <NavLink to="/admin/system-logs">Nhật ký Hệ thống</NavLink>
        </nav>
      </div>

      {/* RIGHT */}
      <div className="admin-right">
        <div className="admin-info">
          <span className="admin-dot" />
          <span className="admin-role">ADMIN</span>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}

export default AdminHeader;
