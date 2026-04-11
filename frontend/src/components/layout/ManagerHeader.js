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
          <NavLink to="/manager/workspace">Tổng quan</NavLink>
          <NavLink to="/manager/orders">Đơn hàng</NavLink>
          <NavLink to="/manager/inventory">Kho</NavLink>
          <NavLink to="/manager/add-product">Thêm SP</NavLink>
          <NavLink to="/manager/payroll">Lương</NavLink>
          <NavLink to="/manager/approvals">Duyệt đơn</NavLink>
          <NavLink to="/manager/attendance">Sửa chấm công</NavLink>
          <NavLink to="/manager/staff">Nhân viên</NavLink>
          <NavLink to="/manager/shifts">📅 Lịch ca</NavLink>
        </nav>
      </div>

      <div className="admin-right">
        <div className="admin-info">
          <span className="admin-dot" />
          <span className="admin-role">MANAGER</span>
        </div>

        <button className="admin-logout" onClick={logout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

export default ManagerHeader;
