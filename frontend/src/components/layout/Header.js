import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="logo">MyShop</div>

      <nav>
        {/* ===== CUSTOMER ===== */}
        {role !== "ADMIN" && (
          <>
            <Link to="/home">Shop</Link>
            <Link to="/cart">Giỏ hàng</Link>
            <Link to="/orders">Đơn hàng</Link>
          </>
        )}

        {/* ===== ADMIN ===== */}
        {role === "ADMIN" && (
          <>
            <Link to="/admin/dashboard">Admin</Link>
          </>
        )}

        {/* ===== LOGOUT (LUÔN HIỆN) ===== */}
        <span className="logout" onClick={logout}>
          Logout
        </span>
      </nav>
    </header>
  );
}

export default Header;
