import React, { useState, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ShoppingCart,
  Search,
  Bot,
  LayoutGrid,
  Minimize2,
  Star,
  Zap,
  ChevronRight,
  Heart,
  Eye,
  X,
  Home,
  Tag,
  Truck,
  Sparkles,
  ShieldCheck,
  Package,
} from "lucide-react";

// ============================================================
//  🐯 DỮ LIỆU SẢN PHẨM MOCK – Tiger Shop
// ============================================================
const showcaseProducts = [
  {
    id: 1,
    name: "Bàn Ghế Gỗ Sồi Tự Nhiên Cao Cấp",
    category: "Nội thất",
    categoryColor: "#10B981",
    price: 8_500_000,
    originalPrice: 11_200_000,
    discount: 24,
    rating: 4.8,
    reviews: 312,
    sold: 1204,
    description:
      "Bộ bàn ghế được chế tác từ gỗ sồi tự nhiên nguyên khối, xử lý chống mối mọt, mang lại vẻ đẹp sang trọng và độ bền vượt trội cho không gian phòng ăn.",
    features: ["Gỗ sồi nguyên khối", "Bảo hành 5 năm", "Miễn phí lắp đặt"],
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=85&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80&fit=crop",
    badge: "Bestseller",
    badgeColor: "#F59E0B",
  },
  {
    id: 2,
    name: "Giày Thể Thao Retro Tiger Classic",
    category: "Thời trang",
    categoryColor: "#F97316",
    price: 1_290_000,
    originalPrice: 1_890_000,
    discount: 32,
    rating: 4.9,
    reviews: 875,
    sold: 5320,
    description:
      "Phiên bản giày retro đặc trưng của Tiger Shop – thiết kế cổ điển pha nét hiện đại, đế cao su siêu nhẹ, phù hợp mọi phong cách street style hay casual.",
    features: ["Đế EVA siêu nhẹ", "Kháng nước cơ bản", "Unisex – 5 màu"],
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=85&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80&fit=crop",
    badge: "Hot 🔥",
    badgeColor: "#EF4444",
  },
  {
    id: 3,
    name: "Tai Nghe Chống Ồn Không Dây Gaming",
    category: "Công nghệ",
    categoryColor: "#8B5CF6",
    price: 3_750_000,
    originalPrice: 5_200_000,
    discount: 28,
    rating: 4.7,
    reviews: 641,
    sold: 2890,
    description:
      "Tai nghe over-ear với chip ANC thế hệ mới, driver 40mm Beryllium, âm thanh vòm 7.1, thời lượng pin 40 giờ – lý tưởng cho gaming marathon và làm việc tập trung.",
    features: ["ANC chủ động", "Pin 40h", "7.1 Surround Sound"],
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=85&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80&fit=crop",
    badge: "New",
    badgeColor: "#3B82F6",
  },
  {
    id: 4,
    name: "Áo Khoác Gió Thời Trang Nam",
    category: "Thời trang",
    categoryColor: "#F97316",
    price: 890_000,
    originalPrice: 1_350_000,
    discount: 34,
    rating: 4.6,
    reviews: 428,
    sold: 3100,
    description:
      "Áo khoác gió nam dáng slim-fit, chất liệu polyester ripstop kháng nước, có túi khóa kéo tiện lợi, phù hợp cho phong cách outdoor hay city streetwear.",
    features: ["Kháng nước DWR", "Slim-fit hiện đại", "4 túi tiện ích"],
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&q=85&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80&fit=crop",
    badge: "Sale",
    badgeColor: "#EC4899",
  },
  {
    id: 5,
    name: "Đèn Cây Trang Trí Scandinavian",
    category: "Nội thất",
    categoryColor: "#10B981",
    price: 1_650_000,
    originalPrice: 2_100_000,
    discount: 21,
    rating: 4.5,
    reviews: 189,
    sold: 741,
    description:
      "Đèn cây phong cách Bắc Âu tối giản, chân đế gỗ sồi kết hợp chao vải linen, ánh sáng ấm 2700K tạo không gian thư giãn cho phòng khách và góc đọc sách.",
    features: ["Ánh sáng ấm 2700K", "Chân gỗ sồi", "Điều chỉnh độ cao"],
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900&q=85&fit=crop",
    thumbnail:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80&fit=crop",
    badge: "Eco",
    badgeColor: "#10B981",
  },
];

// ============================================================
//  🛠️ UTILITY HELPERS
// ============================================================
const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    price
  );

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// ============================================================
//  🔲 NAVBAR COMPONENT
// ============================================================
function TigerNavbar({ cartCount, onOpenChat, onOpenSearch }) {
  const navLinks = [
    { label: "Trang chủ", icon: Home },
    { label: "Sản phẩm", icon: Package },
    { label: "Khuyến mãi", icon: Tag },
    { label: "Theo dõi đơn hàng", icon: Truck },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10"
      style={{
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* ── Logo ── */}
        <motion.div
          className="flex items-center gap-2 select-none flex-shrink-0"
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg"
            style={{
              background: "linear-gradient(135deg, #FF8C00 0%, #CC5500 100%)",
              boxShadow: "0 4px 14px rgba(255,140,0,0.5)",
            }}
          >
            🐯
          </div>
          <div>
            <div
              className="text-white font-black tracking-widest text-sm leading-none"
              style={{ fontFamily: "Lexend, sans-serif", letterSpacing: "0.15em" }}
            >
              TIGER<span style={{ color: "#FF8C00" }}>SHOP</span>
            </div>
            <div
              className="text-xs font-medium leading-none mt-0.5"
              style={{ color: "#FF8C00", fontFamily: "Inter, sans-serif" }}
            >
              E-Commerce AI
            </div>
          </div>
        </motion.div>

        {/* ── Nav Links (Desktop) ── */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ label, icon: Icon }) => (
            <motion.button
              key={label}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/80 text-sm font-medium transition-all"
              whileHover={{
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,1)",
              }}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              <Icon size={14} />
              {label}
            </motion.button>
          ))}
        </nav>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Smart Search */}
          <motion.button
            onClick={onOpenSearch}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-white/70 text-xs border border-white/15 hover:border-orange-400/50 transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              fontFamily: "Inter, sans-serif",
            }}
            whileHover={{ scale: 1.03, backgroundColor: "rgba(255,140,0,0.12)" }}
          >
            <Sparkles size={13} className="text-orange-400" />
            <span>Tìm kiếm AI...</span>
            <kbd
              className="ml-1 px-1.5 py-0.5 rounded text-white/30 border border-white/10"
              style={{ fontSize: "10px" }}
            >
              ⌘K
            </kbd>
          </motion.button>

          {/* Search icon mobile */}
          <motion.button
            onClick={onOpenSearch}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-xl text-white/70 border border-white/15"
            style={{ background: "rgba(255,255,255,0.06)" }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search size={16} />
          </motion.button>

          {/* Cart */}
          <motion.button
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-white/80 border border-white/15"
            style={{ background: "rgba(255,255,255,0.06)" }}
            whileHover={{ scale: 1.08, borderColor: "rgba(255,140,0,0.5)" }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingCart size={17} />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white font-bold flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #FF8C00, #EF4444)",
                  fontSize: "10px",
                }}
              >
                {cartCount}
              </motion.span>
            )}
          </motion.button>

          {/* AI Chatbot */}
          <motion.button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, #FF8C00 0%, #CC5500 100%)",
              boxShadow: "0 4px 14px rgba(255,140,0,0.4)",
              fontFamily: "Lexend, sans-serif",
            }}
            whileHover={{ scale: 1.05, boxShadow: "0 6px 20px rgba(255,140,0,0.6)" }}
            whileTap={{ scale: 0.97 }}
          >
            <Bot size={14} />
            <span className="hidden sm:inline">Tiger AI</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}

// ============================================================
//  ⭐ STAR RATING
// ============================================================
function StarRating({ rating, reviews }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={13}
            fill={s <= Math.round(rating) ? "#F59E0B" : "transparent"}
            stroke={s <= Math.round(rating) ? "#F59E0B" : "#6B7280"}
          />
        ))}
      </div>
      <span className="text-white/60 text-xs">
        {rating} ({reviews.toLocaleString("vi-VN")} đánh giá)
      </span>
    </div>
  );
}

// ============================================================
//  🖼️ MAIN HERO SHOWCASE COMPONENT
// ============================================================
export default function TigerHeroShowcase({ onOpenChat }) {
  const [activeId, setActiveId] = useState(showcaseProducts[0].id);
  const [isGridView, setIsGridView] = useState(false);
  const [cartCount, setCartCount] = useState(2);
  const [wishlist, setWishlist] = useState(new Set());
  const [addedToCart, setAddedToCart] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "ai",
      text: "Xin chào! Tôi là Tiger AI 🐯. Tôi có thể giúp bạn tìm sản phẩm phù hợp, tư vấn về chính sách bảo hành, hay so sánh giá. Hỏi tôi bất cứ điều gì nhé!",
    },
  ]);

  const activeProduct = showcaseProducts.find((p) => p.id === activeId);

  const handleAddToCart = useCallback(
    (productId) => {
      setCartCount((prev) => prev + 1);
      setAddedToCart(productId);
      setTimeout(() => setAddedToCart(null), 2000);
    },
    []
  );

  const handleToggleWishlist = useCallback((productId) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const handleOpenChat = useCallback(() => {
    setIsChatOpen(true);
    if (onOpenChat) onOpenChat();
  }, [onOpenChat]);

  const handleSendChat = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: msg },
      {
        role: "ai",
        text: `Tiger AI đang xử lý yêu cầu của bạn về "${msg}". Vui lòng chờ trong giây lát... 🐯✨`,
      },
    ]);
    setChatInput("");
  }, [chatInput]);

  return (
    <LayoutGroup>
      {/* ── Wrapper toàn trang ── */}
      <div
        className="min-h-screen flex flex-col"
        style={{
          background: "linear-gradient(135deg, #0A0A0F 0%, #111118 50%, #0D0D18 100%)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* ── NAVBAR ── */}
        <TigerNavbar
          cartCount={cartCount}
          onOpenChat={handleOpenChat}
          onOpenSearch={() => {}}
        />

        {/* ── MAIN HERO AREA ── */}
        <main className="flex-1 flex flex-col pt-16">
          <motion.div
            layout
            className="relative flex flex-col"
            style={{ minHeight: "calc(100vh - 4rem)" }}
          >
            {/* Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute rounded-full"
                style={{
                  width: 600,
                  height: 600,
                  top: "-15%",
                  right: "-10%",
                  background: "radial-gradient(circle, rgba(255,140,0,0.12) 0%, transparent 70%)",
                  filter: "blur(60px)",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: 400,
                  height: 400,
                  bottom: "10%",
                  left: "-5%",
                  background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
                  filter: "blur(60px)",
                }}
              />
            </div>

            {/* ── FOCUSED VIEW: Main Product Stage ── */}
            <motion.div
              layout
              className={`relative flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-4 sm:px-8 lg:px-16 ${
                isGridView ? "py-10" : "py-12 lg:py-20"
              }`}
              transition={springTransition}
            >
              {/* Product Image */}
              <motion.div
                layout
                className="relative flex-shrink-0"
                style={{
                  width: isGridView ? "min(340px, 90vw)" : "min(500px, 90vw)",
                  aspectRatio: "1 / 1",
                }}
                transition={springTransition}
              >
                {/* Glow effect behind image */}
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: `radial-gradient(circle at center, ${activeProduct.categoryColor}22 0%, transparent 70%)`,
                    filter: "blur(30px)",
                    transform: "scale(1.1)",
                  }}
                />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`main-img-${activeId}`}
                    layoutId={`product-image-${activeId}`}
                    className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10"
                    style={{
                      boxShadow: `0 30px 80px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)`,
                    }}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <img
                      src={activeProduct.image}
                      alt={activeProduct.name}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />

                    {/* Overlay gradient bottom */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
                      }}
                    />

                    {/* Badge */}
                    <div className="absolute top-4 left-4">
                      <motion.span
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white font-bold text-xs"
                        style={{
                          background: activeProduct.badgeColor,
                          boxShadow: `0 4px 12px ${activeProduct.badgeColor}55`,
                          fontFamily: "Lexend, sans-serif",
                        }}
                      >
                        <Zap size={11} />
                        {activeProduct.badge}
                      </motion.span>
                    </div>

                    {/* Discount badge */}
                    <div className="absolute top-4 right-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-white font-black"
                        style={{
                          background: "linear-gradient(135deg, #EF4444, #DC2626)",
                          boxShadow: "0 4px 14px rgba(239,68,68,0.5)",
                          fontSize: "10px",
                          lineHeight: "1.1",
                        }}
                      >
                        <span>-{activeProduct.discount}%</span>
                      </motion.div>
                    </div>

                    {/* Wishlist button */}
                    <motion.button
                      className="absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center border border-white/20"
                      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleWishlist(activeProduct.id)}
                    >
                      <Heart
                        size={17}
                        fill={wishlist.has(activeProduct.id) ? "#EF4444" : "transparent"}
                        stroke={wishlist.has(activeProduct.id) ? "#EF4444" : "white"}
                      />
                    </motion.button>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* ── Product Info Panel ── */}
              <motion.div
                layout
                className="flex flex-col gap-5 text-white max-w-lg w-full"
                transition={springTransition}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`info-${activeId}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-5"
                  >
                    {/* Category Badge */}
                    <motion.span
                      className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
                      style={{
                        color: activeProduct.categoryColor,
                        borderColor: `${activeProduct.categoryColor}44`,
                        background: `${activeProduct.categoryColor}15`,
                        fontFamily: "Lexend, sans-serif",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {activeProduct.category === "Công nghệ" && <Zap size={11} />}
                      {activeProduct.category === "Thời trang" && <Sparkles size={11} />}
                      {activeProduct.category === "Nội thất" && <ShieldCheck size={11} />}
                      {activeProduct.category}
                    </motion.span>

                    {/* Product Title */}
                    <h1
                      className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight"
                      style={{
                        fontFamily: "Lexend, sans-serif",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {activeProduct.name}
                    </h1>

                    {/* Rating */}
                    <StarRating
                      rating={activeProduct.rating}
                      reviews={activeProduct.reviews}
                    />

                    {/* Description */}
                    <p className="text-white/65 text-sm leading-relaxed line-clamp-3">
                      {activeProduct.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2">
                      {activeProduct.features.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-white/80 border border-white/10"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                          <ShieldCheck size={10} className="text-green-400" />
                          {f}
                        </span>
                      ))}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-end gap-3">
                      <span
                        className="text-3xl lg:text-4xl font-black"
                        style={{
                          color: "#FF8C00",
                          fontFamily: "Lexend, sans-serif",
                        }}
                      >
                        {formatPrice(activeProduct.price)}
                      </span>
                      <span className="text-white/40 line-through text-base mb-1">
                        {formatPrice(activeProduct.originalPrice)}
                      </span>
                    </div>

                    {/* Sold count */}
                    <p className="text-white/50 text-xs -mt-3">
                      Đã bán{" "}
                      <span className="text-white/80 font-semibold">
                        {activeProduct.sold.toLocaleString("vi-VN")}
                      </span>{" "}
                      sản phẩm
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-1">
                      {/* Add to Cart */}
                      <motion.button
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white"
                        style={{
                          background:
                            addedToCart === activeProduct.id
                              ? "linear-gradient(135deg, #10B981, #059669)"
                              : "linear-gradient(135deg, #FF8C00, #CC5500)",
                          boxShadow:
                            addedToCart === activeProduct.id
                              ? "0 8px 24px rgba(16,185,129,0.4)"
                              : "0 8px 24px rgba(255,140,0,0.4)",
                          fontFamily: "Lexend, sans-serif",
                        }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleAddToCart(activeProduct.id)}
                      >
                        <ShoppingCart size={16} />
                        {addedToCart === activeProduct.id
                          ? "Đã thêm vào giỏ ✓"
                          : "Thêm vào giỏ"}
                      </motion.button>

                      {/* View Detail */}
                      <motion.button
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white border border-white/20"
                        style={{
                          background: "rgba(255,255,255,0.07)",
                          backdropFilter: "blur(8px)",
                          fontFamily: "Lexend, sans-serif",
                        }}
                        whileHover={{
                          scale: 1.03,
                          y: -2,
                          borderColor: "rgba(255,140,0,0.5)",
                          background: "rgba(255,140,0,0.1)",
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <Eye size={16} />
                        Xem chi tiết
                      </motion.button>
                    </div>

                    {/* AI Consult Button */}
                    <motion.button
                      onClick={handleOpenChat}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm border border-orange-400/30 text-orange-300"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,140,0,0.08), rgba(139,92,246,0.08))",
                        fontFamily: "Inter, sans-serif",
                      }}
                      whileHover={{
                        scale: 1.02,
                        borderColor: "rgba(255,140,0,0.6)",
                        color: "#FDBA74",
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Bot size={15} />
                      Tư vấn với Tiger AI về sản phẩm này
                      <ChevronRight size={14} />
                    </motion.button>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* ── THUMBNAIL GALLERY (Grid View) ── */}
            <AnimatePresence>
              {isGridView && (
                <motion.section
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 60 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="px-4 sm:px-8 lg:px-16 pb-28"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h2
                      className="text-white font-black text-xl"
                      style={{ fontFamily: "Lexend, sans-serif" }}
                    >
                      Bộ sưu tập nổi bật
                    </h2>
                    <span className="text-white/40 text-sm">
                      {showcaseProducts.length} sản phẩm
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {showcaseProducts.map((product) => {
                      const isActive = product.id === activeId;
                      return (
                        <motion.div
                          key={product.id}
                          layoutId={`thumb-container-${product.id}`}
                          className="relative cursor-pointer rounded-2xl overflow-hidden border-2 flex-shrink-0"
                          style={{
                            borderColor: isActive
                              ? "#FF8C00"
                              : "rgba(255,255,255,0.08)",
                            boxShadow: isActive
                              ? "0 0 0 3px rgba(255,140,0,0.3), 0 16px 40px rgba(0,0,0,0.4)"
                              : "0 8px 24px rgba(0,0,0,0.3)",
                            aspectRatio: "3/4",
                          }}
                          whileHover={{
                            scale: 1.05,
                            borderColor: isActive
                              ? "#FF8C00"
                              : "rgba(255,140,0,0.6)",
                            boxShadow: isActive
                              ? "0 0 0 3px rgba(255,140,0,0.4), 0 20px 50px rgba(0,0,0,0.5)"
                              : "0 0 0 2px rgba(255,140,0,0.3), 0 16px 40px rgba(255,140,0,0.2)",
                          }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setActiveId(product.id)}
                          transition={springTransition}
                        >
                          {/* Thumbnail Image */}
                          <motion.img
                            layoutId={`product-image-${product.id}`}
                            src={product.thumbnail}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            transition={springTransition}
                          />

                          {/* Overlay */}
                          <div
                            className="absolute inset-0"
                            style={{
                              background: isActive
                                ? "linear-gradient(to top, rgba(255,140,0,0.4) 0%, transparent 60%)"
                                : "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
                            }}
                          />

                          {/* Product info overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p
                              className="text-white font-bold text-xs leading-tight line-clamp-2"
                              style={{ fontFamily: "Lexend, sans-serif" }}
                            >
                              {product.name}
                            </p>
                            <p
                              className="text-orange-300 font-bold text-xs mt-1"
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              {formatPrice(product.price)}
                            </p>
                          </div>

                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute top-3 right-3">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: "#FF8C00" }}
                              >
                                <span className="text-white text-xs font-black">✓</span>
                              </motion.div>
                            </div>
                          )}

                          {/* Category badge */}
                          <div className="absolute top-3 left-3">
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-white font-bold"
                              style={{
                                background: product.categoryColor,
                                fontSize: "9px",
                                fontFamily: "Lexend, sans-serif",
                              }}
                            >
                              {product.category}
                            </span>
                          </div>

                          {/* Wishlist on card */}
                          <motion.button
                            className="absolute bottom-3 right-3 w-7 h-7 rounded-full flex items-center justify-center border border-white/20"
                            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(product.id);
                            }}
                          >
                            <Heart
                              size={12}
                              fill={wishlist.has(product.id) ? "#EF4444" : "transparent"}
                              stroke={wishlist.has(product.id) ? "#EF4444" : "white"}
                            />
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>
        </main>

        {/* ── TOGGLE FLOATING BUTTON ── */}
        <motion.button
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full text-white font-bold text-sm z-40 border border-white/20"
          style={{
            background: isGridView
              ? "rgba(255,140,0,0.9)"
              : "rgba(0,0,0,0.7)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: isGridView
              ? "0 8px 32px rgba(255,140,0,0.5)"
              : "0 8px 32px rgba(0,0,0,0.5)",
            fontFamily: "Lexend, sans-serif",
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsGridView((v) => !v)}
          layout
        >
          {isGridView ? (
            <>
              <Minimize2 size={15} />
              Thu gọn
            </>
          ) : (
            <>
              <LayoutGrid size={15} />
              Xem bộ sưu tập
            </>
          )}
        </motion.button>

        {/* ============================================================
             🤖 AI CHATBOT PANEL
        ============================================================ */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col rounded-3xl border border-white/10 overflow-hidden"
              style={{
                width: "min(380px, calc(100vw - 2rem))",
                height: "min(520px, calc(100vh - 8rem))",
                background: "rgba(10,10,20,0.92)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,140,0,0.15)",
              }}
            >
              {/* Chat Header */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b border-white/10"
                style={{
                  background: "linear-gradient(135deg, rgba(255,140,0,0.15), rgba(139,92,246,0.1))",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #FF8C00, #CC5500)",
                      boxShadow: "0 4px 12px rgba(255,140,0,0.4)",
                    }}
                  >
                    🐯
                  </div>
                  <div>
                    <p
                      className="text-white font-bold text-sm leading-none"
                      style={{ fontFamily: "Lexend, sans-serif" }}
                    >
                      Tiger AI
                    </p>
                    <p className="text-green-400 text-xs mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      Đang hoạt động
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setIsChatOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white border border-white/10 hover:border-white/30 transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={15} />
                </motion.button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                {chatMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5"
                        style={{ background: "linear-gradient(135deg, #FF8C00, #CC5500)" }}
                      >
                        🐯
                      </div>
                    )}
                    <div
                      className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background:
                          msg.role === "user"
                            ? "linear-gradient(135deg, #FF8C00, #CC5500)"
                            : "rgba(255,255,255,0.08)",
                        color: "white",
                        borderRadius:
                          msg.role === "user"
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                      }}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="px-4 py-3 border-t border-white/10">
                <div
                  className="flex items-center gap-2 rounded-2xl px-3 py-2 border border-white/15"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Hỏi Tiger AI về sản phẩm..."
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                  <motion.button
                    onClick={handleSendChat}
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: chatInput.trim()
                        ? "linear-gradient(135deg, #FF8C00, #CC5500)"
                        : "rgba(255,255,255,0.08)",
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight
                      size={15}
                      className={chatInput.trim() ? "text-white" : "text-white/30"}
                    />
                  </motion.button>
                </div>
                <p className="text-white/25 text-xs text-center mt-2" style={{ fontFamily: "Inter, sans-serif" }}>
                  Tiger AI • Powered by Gemini
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Chat Floating Trigger (when closed) */}
        <AnimatePresence>
          {!isChatOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleOpenChat}
              className="fixed bottom-6 right-4 sm:right-6 z-40 w-14 h-14 rounded-2xl flex items-center justify-center text-white"
              style={{
                background: "linear-gradient(135deg, #FF8C00, #CC5500)",
                boxShadow: "0 8px 28px rgba(255,140,0,0.55)",
              }}
              whileHover={{ scale: 1.1, y: -3, boxShadow: "0 12px 36px rgba(255,140,0,0.7)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Bot size={24} />
              <motion.span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: "#10B981", fontSize: "8px" }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <span className="text-white font-black" style={{ fontSize: "7px" }}>
                  AI
                </span>
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
