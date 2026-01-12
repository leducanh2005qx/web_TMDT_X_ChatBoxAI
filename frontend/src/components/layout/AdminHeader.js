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
          <span className="logo-text">TIGER SHOP</span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/categories">Categories</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/chat">Chat</NavLink>
          <NavLink to="/admin/stats">Stats</NavLink>
        </nav>
      </div>

      {/* RIGHT */}
      <div className="admin-right">
        <span className="admin-badge">ADMIN</span>

        <button className="admin-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
