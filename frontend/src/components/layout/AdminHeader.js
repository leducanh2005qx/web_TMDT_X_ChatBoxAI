import { NavLink, useNavigate } from "react-router-dom";
import "./AdminHeader.css";

function AdminHeader() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

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
          <NavLink to="/admin/users">Người dùng</NavLink>
          <NavLink to="/admin/categories">Danh mục</NavLink>
          <NavLink to="/admin/orders">Đơn hàng</NavLink>
          <NavLink to="/admin/add-product">Thêm SP</NavLink>
          <NavLink to="/admin/vouchers">Khuyến mãi</NavLink>
          <NavLink to="/admin/staff-approvals">Duyệt NV</NavLink>
          <NavLink to="/admin/product-approvals">Duyệt SP</NavLink>
          <NavLink to="/admin/chat">Chat</NavLink>
          <NavLink to="/admin/stats">Thống kê</NavLink>
        </nav>
      </div>

      {/* RIGHT */}
      <div className="admin-right">
        <div className="admin-info">
          <span className="admin-dot" />
          <span className="admin-role">ADMIN</span>
        </div>

        <button className="admin-logout" onClick={logout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
