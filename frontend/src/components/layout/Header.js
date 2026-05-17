import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import UserMenu from "../common/UserMenu";
import "./Header.css";

import { io } from "socket.io-client";
import { getUnreadNotificationCount } from "../../services/api";

function Header({ cart = [], cartCount = 0, onSearch }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bump, setBump] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const currentCartCount = cartCount || cart.length;

  // ===== CART ANIMATION =====
  useEffect(() => {
    if (currentCartCount === 0) return;
    setBump(true);
    const timer = setTimeout(() => setBump(false), 400); // Wait for animation
    return () => clearTimeout(timer);
  }, [currentCartCount]);

  // ===== CHECK LOGIN + ROLE =====
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLogin(!!token);

    // ✅ GIỮ LOGIC CŨ: ROLE LƯU RIÊNG
    const role = (localStorage.getItem("role") || "").toLowerCase();
    setIsAdmin(role === "admin");

    // Logic cũ đã được di chuyển một phần sang UserMenu,
    // ở đây ta chỉ cần role để hiển thị Menu phù hợp.
  }, [location.pathname]);

  // ===== SOCKET & NOTIFICATION =====
  useEffect(() => {
    if (!isLogin) {
      setUnreadCount(0);
      return;
    }

    // Lấy số đếm ban đầu
    getUnreadNotificationCount()
      .then((res) => setUnreadCount(res.count || 0))
      .catch((err) => console.error("Lỗi lấy thông báo:", err));

    // Lắng nghe socket
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("http://localhost:5000", { transports: ["websocket"] });
    
    // Yêu cầu join room nếu backend cần
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.id) {
      socket.emit("joinUserRoom", user.id); // Tùy thuộc logic backend
    }

    socket.on("new_notification_count", (count) => {
      setUnreadCount(count);
    });

    const handleRead = () => setUnreadCount(0);
    window.addEventListener("notifications_read", handleRead);

    return () => {
      socket.disconnect();
      window.removeEventListener("notifications_read", handleRead);
    };
  }, [isLogin]);



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
        {/* 🛒 CART ITEM - Thêm class cart-icon-nav để làm hiệu ứng bay */}
        <Link to="/cart" className={`cart-btn cart-icon-nav ${bump ? "bump-pop" : ""}`}>
          🛒
          {currentCartCount > 0 && (
            <span className="cart-badge">{currentCartCount}</span>
          )}
        </Link>

        {isLogin ? (
          <UserMenu textColor="text-white" unreadCount={unreadCount} />
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
