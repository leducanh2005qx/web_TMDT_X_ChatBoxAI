import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Header.css";

function Header({ cart = [], cartCount = 0, onSearch }) {
  const [keyword, setKeyword] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // ===== CHECK LOGIN + ROLE =====
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLogin(!!token);

    // ✅ GIỮ LOGIC CŨ: ROLE LƯU RIÊNG
    const role = (localStorage.getItem("role") || "").toLowerCase();
    setIsAdmin(role === "admin");

    if (token) {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        setUserName(user?.name || "");
      } catch {
        setUserName("");
      }
    } else {
      setUserName("");
    }
  }, [location.pathname]);

  // ===== LOGOUT =====
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  // ===== SEARCH =====
  const handleSearch = (e) => {
    const value = e.target.value;
    setKeyword(value);
    onSearch && onSearch(value);

    if (location.pathname !== "/shop") {
      navigate("/shop");
    }
  };

  return (
    <header className="header">
      {/* ===== LEFT ===== */}
      <div className="header-left">
        <Link to="/home" className="logo">
          TIGER SHOP
        </Link>

        <nav className="nav">
          <Link to="/home">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/orders">Orders</Link>

          {/* 🎁 CUSTOMER: NHẬN VOUCHER */}
          {isLogin && !isAdmin && (
            <Link to="/vouchers" className="voucher-link">
              🎁 Voucher
            </Link>
          )}

          {/* 👑 ADMIN */}
          {isAdmin && (
            <>
              <Link to="/admin/dashboard">Admin</Link>
              <Link to="/admin/vouchers">Vouchers</Link>
            </>
          )}
        </nav>
      </div>

      {/* ===== CENTER ===== */}
      <div className="header-center">
        <input
          type="text"
          className="header-search"
          placeholder="Tìm kiếm sản phẩm..."
          value={keyword}
          onChange={handleSearch}
        />
      </div>

      {/* ===== RIGHT ===== */}
      <div className="header-right">
        <Link to="/cart" className="cart-btn">
          🛒
          {(cartCount || cart.length) > 0 && (
            <span className="cart-badge">{cartCount || cart.length}</span>
          )}
        </Link>

        {isLogin ? (
          <div className="user-box">
            <span
              className="user-name"
              onClick={() => navigate("/profile")}
              style={{ cursor: "pointer" }}
            >
              👤 {userName}
            </span>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="login-link">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
