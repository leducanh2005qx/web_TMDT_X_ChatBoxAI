import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Search, ShoppingCart, User, MessageCircle, X, Mail,
  Home, LayoutGrid, MapPin, Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserMenu from "../common/UserMenu";
import { io } from "socket.io-client";
import { getUnreadNotificationCount } from "../../services/api";

function Layout({ children, cart = [], onSearch }) {
  const [keyword, setKeyword] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", content: "Xin chào! Mình là Tiger AI, bạn cần hỗ trợ gì ạ?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLogin(!!token);
  }, [location.pathname]);

  // ===== SOCKET & NOTIFICATION =====
  useEffect(() => {
    if (!isLogin) {
      setUnreadCount(0);
      return;
    }
    getUnreadNotificationCount()
      .then((res) => setUnreadCount(res.count || 0))
      .catch(() => {});

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io("http://localhost:5000", { transports: ["websocket"] });
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.id) socket.emit("joinUserRoom", user.id);

    socket.on("new_notification_count", (count) => setUnreadCount(count));

    const handleRead = () => setUnreadCount(0);
    window.addEventListener("notifications_read", handleRead);

    return () => {
      socket.disconnect();
      window.removeEventListener("notifications_read", handleRead);
    };
  }, [isLogin]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(keyword);
    if (location.pathname !== "/shop") {
      navigate("/shop");
    }
  };

  // handleLogout đã được chuyển hoàn toàn vào UserMenu

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { role: "user", content: chatInput }]);
    const userMessage = chatInput;
    setChatInput("");
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: "ai", 
        content: `Cảm ơn bạn đã nhắn tin: "${userMessage}". Tính năng AI Sentiment đang được tích hợp!` 
      }]);
    }, 1000);
  };

  const cartCount = cart?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {/* HEADER TIGER SHOP (Modern Sticky Style) */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-md shadow-md py-2" 
            : "bg-[#FF8C00] text-white py-4"
        }`}
      >
        <div className="container mx-auto px-4 flex items-center gap-4 lg:gap-8">
          {/* Logo */}
          <Link to="/home" className={`flex items-center gap-2 font-bold tracking-tight transition-all ${isScrolled ? "text-[#FF8C00] text-2xl" : "text-white text-3xl"}`}>
            <span className="font-['Lexend']">TIGER</span>
            <span className={`${isScrolled ? "hidden" : "inline"}`}>SHOP</span>
            <span className="text-3xl leading-none">🐯</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 flex justify-center max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className={`flex w-full overflow-hidden transition-all duration-300 rounded-xl border ${isScrolled ? "bg-gray-100 border-gray-200" : "bg-white border-transparent"} p-1`}>
              <input 
                type="text" 
                className="flex-1 px-4 py-1.5 text-sm bg-transparent text-gray-800 outline-none w-full"
                placeholder="Tìm kiếm sản phẩm Tiger..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button type="submit" className={`p-2 flex items-center justify-center rounded-lg transition-colors ${isScrolled ? "bg-[#FF8C00] text-white" : "text-[#FF8C00] hover:bg-gray-50"}`}>
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/cart" className={`relative transition-colors ${isScrolled ? "text-gray-700 hover:text-[#FF8C00]" : "text-white hover:text-white/80"}`}>
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {isLogin ? (
              <UserMenu
                textColor={isScrolled ? "text-gray-800" : "text-white"}
                unreadCount={unreadCount}
              />
            ) : (
              <Link to="/login" className={`font-bold text-sm ${isScrolled ? "text-gray-800" : "text-white"}`}>Đăng nhập</Link>
            )}
          </div>
        </div>
      </header>

      {/* Spacer for Fixed Header */}
      <div className="h-20 lg:h-24"></div>

      {/* MAIN CONTENT */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <Link to="/home" className={`flex flex-col items-center gap-1 ${location.pathname === "/home" ? "text-[#FF8C00]" : "text-gray-400"}`}>
          <Home size={22} />
          <span className="text-[10px] font-bold">Trang chủ</span>
        </Link>
        <Link to="/shop" className={`flex flex-col items-center gap-1 ${location.pathname === "/shop" ? "text-[#FF8C00]" : "text-gray-400"}`}>
          <LayoutGrid size={22} />
          <span className="text-[10px] font-bold">Danh mục</span>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center gap-1 relative ${location.pathname === "/cart" ? "text-[#FF8C00]" : "text-gray-400"}`}>
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-bold">Giỏ hàng</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 ${location.pathname === "/profile" ? "text-[#FF8C00]" : "text-gray-400"}`}>
          <User size={22} />
          <span className="text-[10px] font-bold">Tôi</span>
        </Link>
      </nav>

      {/* KHỐI MỜI ĐĂNG KÝ THÀNH VIÊN - ĐẶT TRÊN FOOTER */}
      {!isLogin && (
        <div className="registration-banner">
          <div className="banner-content">
            <h2>GIA NHẬP ĐẠI GIA ĐÌNH TIGER SHOP 🐯</h2>
            <p>Đăng ký thành viên ngay để nhận <b>Voucher 50% (giảm tới 100k)</b> cho đơn hàng đầu tiên từ 50k!</p>
            <button className="register-now-btn" onClick={() => navigate('/register')}>Đăng ký nhận quà ngay</button>
          </div>
        </div>
      )}

      {/* FOOTER CHỈN CHU CHO TIGER SHOP */}
      <footer className="tiger-footer">
        <div className="container">
          <div className="footer-column">
            <h3 className="footer-logo"><span>TIGER</span> SHOP</h3>
            <p><MapPin size={16} color="#FF8C00" /> Tiger Shop - Yên Nghĩa - Hà Đông</p>
            <p style={{fontStyle: 'italic', opacity: 0.8}}>"Đồ tốt, giá gốc – Ship Hỏa Tốc khắp Hà Đông!"</p>
          </div>
          <div className="footer-column">
            <h4>CHÍNH SÁCH</h4>
            <ul>
              <li>Chính sách bảo hành</li>
              <li>Giao hàng hỏa tốc</li>
              <li>Đổi trả trong 7 ngày</li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>LIÊN HỆ SẾP ĐỨC ANH</h4>
            <p><Phone size={16} color="#FF8C00" /> Hotline: 0xxx.xxx.xxx</p>
            <p><Mail size={16} color="#FF8C00" /> Email: 23010219@st.phenikaa-uni.edu.vn</p>
            <div className="social-icons">
              <div><i className="fab fa-facebook text-lg"></i></div>
              <div><i className="fab fa-tiktok text-lg"></i></div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Tiger Shop - Sản phẩm của sếp Lê Đình Đức Anh - MSSV: 23010219</p>
        </div>
      </footer>

      {/* FLOATING CHAT */}
      <div className="fixed bottom-24 right-6 lg:bottom-6 lg:right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-white w-80 shadow-2xl rounded-2xl border border-gray-100 overflow-hidden mb-4 flex flex-col h-96"
            >
              <div className="bg-[#FF8C00] text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-xl">🐯</span> <span>Tiger AI</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={18} /></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3 scrollbar-hide">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`max-w-[85%] rounded-2xl p-3 text-[13px] shadow-sm ${msg.role === 'ai' ? 'bg-white text-gray-800 self-start rounded-tl-sm' : 'bg-[#FF8C00] text-white self-end rounded-tr-sm'}`}>
                    {msg.content}
                  </div>
                ))}
              </div>
              <form onSubmit={handleChatSubmit} className="p-3 bg-white flex items-center gap-2 border-t">
                <input 
                  type="text" 
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-[#FF8C00] transition-all"
                  placeholder="Hỏi Tiger AI..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" disabled={!chatInput.trim()} className="bg-[#FF8C00] text-white rounded-full p-2 disabled:bg-gray-200"><MessageCircle size={18} /></button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-[#FF8C00] text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white z-10"
        >
          {isChatOpen ? <X size={24} /> : <span className="text-2xl">🐯</span>}
        </motion.button>
      </div>
    </div>
  );
}

export default Layout;
