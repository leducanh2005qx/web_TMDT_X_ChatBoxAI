import { NavLink, useNavigate } from "react-router-dom";
import "./AdminHeader.css";

function ManagerHeader() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
    window.location.reload();
  };

  return (
    <header className="admin-header">
      <div className="admin-left">
        <div
          className="admin-brand"
          onClick={() => navigate("/manager/workspace")}
        >
          <span className="logo-icon">🐯</span>
          <div className="brand-text">
            <span className="logo-text">TIGER SHOP</span>
            <span className="logo-sub">Manager Panel</span>
          </div>
        </div>

        <nav className="admin-nav">
          <NavLink to="/manager/workspace">Tong quan</NavLink>
          <NavLink to="/manager/orders">Don hang</NavLink>
          <NavLink to="/manager/inventory">Kho</NavLink>
          <NavLink to="/manager/payroll">Luong</NavLink>
          <NavLink to="/manager/approvals">Duyet don</NavLink>
          <NavLink to="/manager/attendance">Fix check-out</NavLink>
          <NavLink to="/manager/staff">Nhan vien</NavLink>
        </nav>
      </div>

      <div className="admin-right">
        <div className="admin-info">
          <span className="admin-dot" />
          <span className="admin-role">MANAGER</span>
        </div>

        <button className="admin-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default ManagerHeader;
