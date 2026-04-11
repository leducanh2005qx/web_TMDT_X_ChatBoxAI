import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ShoppingCart, User, MessageCircle, X, Mail, Share2 } from "lucide-react";

function Layout({ children, cart = [], onSearch }) {
  const [keyword, setKeyword] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [userName, setUserName] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", content: "Xin chào! Mình là Tiger AI, bạn cần hỗ trợ gì ạ?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLogin(!!token);
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(keyword);
    if (location.pathname !== "/shop") {
      navigate("/shop");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { role: "user", content: chatInput }]);
    const userMessage = chatInput;
    setChatInput("");
    
    // Giả lập kết nối AI Gemini (trong thực tế sẽ call API)
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: "ai", 
        content: `Cảm ơn bạn đã nhắn tin: "${userMessage}". Tính năng AI Sentiment đang được tích hợp!` 
      }]);
    }, 1000);
  };

  const cartCount = cart?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* HEADER TIGER SHOP (Shopee Style) */}
      <header className="bg-[#ee4d2d] text-white">
        {/* Top Navbar */}
        <div className="container mx-auto px-4 py-1 flex items-center justify-between text-xs font-light">
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-white/80">Vào cửa hàng trên ứng dụng Tiger Shop</Link>
            <span className="flex items-center gap-1 hover:text-white/80 cursor-pointer">Kết nối <Share2 size={12}/></span>
          </div>
          <div className="flex gap-4 items-center">
            <Link to="/orders" className="flex items-center gap-1 hover:text-white/80">Theo dõi đơn hàng</Link>
          </div>
        </div>

        {/* Main Header */}
        <div className="container mx-auto px-4 py-4 flex items-center gap-8">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 text-3xl font-bold font-sans tracking-wide hover:opacity-90 transition-opacity">
            <span>TIGER SHOP</span>
            <span className="text-4xl leading-none -mt-2">🐯</span>
          </Link>

          {/* Search Bar - Cực Đại */}
          <div className="flex-1 flex justify-center">
            <form onSubmit={handleSearch} className="flex w-full max-w-3xl bg-white rounded-sm overflow-hidden p-1 shadow-sm">
              <input 
                type="text" 
                className="flex-1 px-4 py-2 text-gray-800 outline-none w-full"
                placeholder="FREE SHIP EXTRA - Tìm kiếm giảm đến 50%"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button type="submit" className="bg-[#ee4d2d] px-6 flex items-center justify-center rounded-sm hover:bg-[#d73f22] transition-colors">
                <Search size={20} className="text-white" />
              </button>
            </form>
          </div>

          {/* Cart & User Avatar */}
          <div className="flex items-center gap-6">
            <Link to="/cart" className="relative hover:opacity-80 transition-opacity">
              <ShoppingCart size={32} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-white text-[#ee4d2d] text-xs font-bold px-2 py-0.5 rounded-full border-2 border-[#ee4d2d]">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2 cursor-pointer group relative">
              <div className="w-8 h-8 rounded-full bg-white text-[#ee4d2d] flex items-center justify-center border-2 border-transparent group-hover:border-white transition-all">
                <User size={20} />
              </div>
              {isLogin ? (
                <div className="flex flex-col text-sm">
                  <span className="font-medium group-hover:text-white/80 transition-colors" onClick={() => navigate("/profile")}>
                    {userName || "Thành viên"}
                  </span>
                  <span onClick={handleLogout} className="text-xs text-white/70 hover:text-white">Đăng xuất</span>
                </div>
              ) : (
                <Link to="/login" className="font-medium hover:text-white/80">Đăng nhập</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow">
        {children}
      </main>

      {/* FOOTER - 4 Cột */}
      <footer className="bg-[#fbfcff] border-t-4 border-[#ee4d2d] pt-12 pb-8 mt-12 text-gray-600 text-sm">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-gray-800 mb-4 uppercase text-xs">Thông tin Shop</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="hover:text-[#ee4d2d]">Giới thiệu Tiger Shop</Link></li>
              <li><Link to="/careers" className="hover:text-[#ee4d2d]">Tuyển dụng</Link></li>
              <li><Link to="/blog" className="hover:text-[#ee4d2d]">Tiger Blog</Link></li>
              <li><Link to="/flash-sale" className="hover:text-[#ee4d2d]">Flash Sale Cuối Tuần</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-gray-800 mb-4 uppercase text-xs">Chính sách</h3>
            <ul className="space-y-3">
              <li><Link to="/policy/shipping" className="hover:text-[#ee4d2d]">Chính sách vận chuyển</Link></li>
              <li><Link to="/policy/returns" className="hover:text-[#ee4d2d]">Chính sách Trả hàng & Hoàn tiền</Link></li>
              <li><Link to="/policy/warranty" className="hover:text-[#ee4d2d]">Chính sách Bảo hành</Link></li>
              <li><Link to="/policy/privacy" className="hover:text-[#ee4d2d]">Chính sách Bảo mật</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-gray-800 mb-4 uppercase text-xs">Tải App Tiger Shop</h3>
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-white border shadow-sm p-1 flex items-center justify-center text-[10px] text-center font-bold text-gray-400">
                QR CODE
              </div>
              <div className="flex flex-col justify-center gap-2">
                <div className="bg-white border rounded px-3 py-1 text-xs shadow-sm cursor-pointer hover:bg-gray-50 font-semibold">
                  App Store
                </div>
                <div className="bg-white border rounded px-3 py-1 text-xs shadow-sm cursor-pointer hover:bg-gray-50 font-semibold">
                  Google Play
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-gray-800 mb-4 uppercase text-xs">Theo dõi chúng tôi</h3>
            <ul className="space-y-4">
              <li>
                <a href="#!" className="flex items-center gap-2 hover:text-[#ee4d2d]">
                  <span className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center"><Share2 size={14}/></span>
                  Facebook
                </a>
              </li>
              <li>
                <a href="#!" className="flex items-center gap-2 hover:text-[#ee4d2d]">
                  <span className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center"><Share2 size={14}/></span>
                  Instagram
                </a>
              </li>
              <li>
                <a href="mailto:tiger@shop.vn" className="flex items-center gap-2 hover:text-[#ee4d2d]">
                  <span className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center"><Mail size={14}/></span>
                  tiger@shop.vn
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="container mx-auto px-4 mt-8 pt-6 border-t font-semibold text-center text-gray-400 text-xs flex flex-col items-center gap-2">
          <p>© 2026 TIGER SHOP. Tất cả các quyền được bảo lưu.</p>
          <p className="max-w-2xl text-[10px] font-normal leading-relaxed text-gray-500">
            Địa chỉ: Tầng 6, Tòa nhà D, Số 1 Đại Cồ Việt, Phường Bách Khoa, Quận Hai Bà Trưng, Thành phố Hà Nội, Việt Nam. Tổng đài hỗ trợ: 19001234.
          </p>
        </div>
      </footer>

      {/* FLOATING CHAT - Góc dưới bên phải */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Khung chat mini */}
        <div 
          className={`bg-white w-80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-lg border border-orange-100 overflow-hidden transition-all duration-300 origin-bottom-right mb-4 flex flex-col ${isChatOpen ? 'scale-100 opacity-100 h-96' : 'scale-0 opacity-0 h-0 w-0'}`}
        >
          {/* Header Chat */}
          <div className="bg-gradient-to-r from-[#ee4d2d] to-[#ff6633] text-white px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 font-bold font-sans">
              <span className="text-2xl drop-shadow-md">🐯</span> 
              <span>Tiger AI</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1 rounded-full text-white/90 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          
          {/* Nội dung Chat */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] rounded-2xl p-2.5 text-[13px] leading-relaxed shadow-sm ${
                  msg.role === 'ai' 
                    ? 'bg-white border border-gray-100 text-gray-800 self-start rounded-tl-sm' 
                    : 'bg-[#ee4d2d] text-white self-end rounded-tr-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          {/* Form nhập chat */}
          <form onSubmit={handleChatSubmit} className="border-t p-2.5 bg-white flex items-center gap-2">
            <input 
              type="text" 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-[#ee4d2d] focus:bg-white transition-colors"
              placeholder="Hỏi Tiger AI về sản phẩm..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim()}
              className="bg-[#ee4d2d] text-white rounded-full p-2.5 hover:bg-[#d73f22] disabled:bg-gray-300 transition-colors"
            >
              <MessageCircle size={18} className={chatInput.trim() ? "translate-x-0.5" : ""} />
            </button>
          </form>
        </div>

        {/* Nút bong bóng chat */}
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 bg-gradient-to-tr from-[#ee4d2d] to-[#ff7337] text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(238,77,45,0.4)] hover:-translate-y-1 transition-all duration-300 border-2 border-white relative z-10 ${!isChatOpen ? 'animate-bounce' : ''}`}
        >
          {isChatOpen ? <X size={26} className="text-white/90" /> : <span className="text-3xl leading-none">🐯</span>}
        </button>
      </div>
    </div>
  );
}

export default Layout;
