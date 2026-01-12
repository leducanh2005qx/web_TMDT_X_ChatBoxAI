import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Header.css";

function Header({ cart = [], cartCount = 0, onSearch }) {
  const [keyword, setKeyword] = useState("");
  const [isLogin, setIsLogin] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLogin(!!localStorage.getItem("token"));
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
    window.location.reload();
  };

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
      <div className="header-left">
        <Link to="/home" className="logo">
          TIGER SHOP
        </Link>

        <nav className="nav">
          <Link to="/home">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/orders">Orders</Link>
        </nav>
      </div>

      <div className="header-center">
        <input
          type="text"
          className="header-search"
          placeholder="Tìm kiếm sản phẩm..."
          value={keyword}
          onChange={handleSearch}
        />
      </div>

      <div className="header-right">
        <Link to="/cart" className="cart-btn">
          🛒
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>

        {isLogin ? (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
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
