import { NavLink, useNavigate } from "react-router-dom";
import "./AdminHeader.css";

function StaffHeader() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  return (
    <header className="admin-header">
      <div className="admin-left">
        <div className="admin-brand" onClick={() => navigate("/staff/workspace")}>
          <span className="logo-icon">🐯</span>
          <div className="brand-text">
            <span className="logo-text">TIGER SHOP</span>
            <span className="logo-sub">Staff Panel</span>
          </div>
        </div>

        <nav className="admin-nav">
          <NavLink to="/staff/workspace">Tổng quan</NavLink>
          <NavLink to="/staff/orders">Đơn hàng</NavLink>
          <NavLink to="/staff/chat">Chat</NavLink>
          <NavLink to="/staff/attendance">Chấm công</NavLink>
          <NavLink to="/staff/requests">Đơn xin</NavLink>
          <NavLink to="/staff/shifts">Ca làm</NavLink>
          <NavLink to="/staff/payroll">Lương</NavLink>
        </nav>
      </div>

      <div className="admin-right">
        <div className="admin-info">
          <span className="admin-dot" />
          <span className="admin-role">STAFF</span>
        </div>

        <button className="admin-logout" onClick={logout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

export default StaffHeader;
