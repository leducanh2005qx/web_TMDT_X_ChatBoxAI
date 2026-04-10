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
          <NavLink to="/staff/workspace">Tong quan</NavLink>
          <NavLink to="/staff/orders">Don hang</NavLink>
          <NavLink to="/staff/chat">Chat</NavLink>
          <NavLink to="/staff/attendance">Cham cong</NavLink>
          <NavLink to="/staff/requests">Don xin</NavLink>
          <NavLink to="/staff/shifts">Ca lam</NavLink>
          <NavLink to="/staff/payroll">Luong</NavLink>
        </nav>
      </div>

      <div className="admin-right">
        <div className="admin-info">
          <span className="admin-dot" />
          <span className="admin-role">STAFF</span>
        </div>

        <button className="admin-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default StaffHeader;
