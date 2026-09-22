import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShoppingCart, ShieldCheck, Zap, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Hàm format tiền tệ VNĐ
const fmt = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

// Màu accent và gradient theo danh mục sản phẩm
function getProductTheme(product) {
  const cat = (product.category_name || product.category || "").toLowerCase();
  if (cat.includes("điện tử") || cat.includes("electron")) {
    return { accentColor: "text-blue-500",  bgGradient: "from-blue-50 to-white",   glowColor: "bg-blue-300"  };
  }
  if (cat.includes("đồng hồ") || cat.includes("watch")) {
    return { accentColor: "text-gray-800",  bgGradient: "from-gray-100 to-white",  glowColor: "bg-gray-400"  };
  }
  if (cat.includes("máy ảnh") || cat.includes("camera")) {
    return { accentColor: "text-neutral-700", bgGradient: "from-neutral-100 to-white", glowColor: "bg-neutral-300" };
  }
  if (cat.includes("thời trang") || cat.includes("fashion")) {
    return { accentColor: "text-pink-500",  bgGradient: "from-pink-50 to-white",   glowColor: "bg-pink-300"  };
  }
  if (cat.includes("giày") || cat.includes("shoes")) {
    return { accentColor: "text-green-600", bgGradient: "from-green-50 to-white",  glowColor: "bg-green-300" };
  }
  if (cat.includes("nội thất") || cat.includes("furniture")) {
    return { accentColor: "text-amber-600", bgGradient: "from-amber-50 to-white",  glowColor: "bg-amber-300" };
  }
  // default – cam Tiger
  return { accentColor: "text-orange-500", bgGradient: "from-orange-50 to-white",  glowColor: "bg-orange-300" };
}

// Badge tự động theo rank trong danh sách
const BADGES = ["Best Seller", "Hot Trend", "New Arrival", "Nổi Bật", "Đặc Quyền"];

export default function TigerProductHero() {
  const [heroProducts, setHeroProducts] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay]     = useState(true);
  const thumbContainerRef               = useRef(null);
  const navigate                        = useNavigate();

  // ── Fetch TẤT CẢ sản phẩm còn hàng và trộn xen kẽ đa dạng mọi danh mục trong kho ──
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:5000/api/products")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // Lọc tất cả sản phẩm còn hàng (stock > 0)
        const inStock = list.filter((p) => Number(p.stock) > 0);

        // Gom nhóm theo danh mục để trộn xen kẽ đều (tránh bị dồn nhiều sản phẩm cùng 1 danh mục)
        const byCategory = {};
        inStock.forEach((p) => {
          const cat = p.category_name || p.category || "Khác";
          if (!byCategory[cat]) byCategory[cat] = [];
          byCategory[cat].push(p);
        });

        // Trộn xen kẽ: lấy lần lượt từng sản phẩm của mỗi danh mục (Nội thất -> Thời trang -> Đồ ăn -> Điện tử...)
        const interleaved = [];
        let hasMore = true;
        let round = 0;
        const catKeys = Object.keys(byCategory);
        while (hasMore) {
          hasMore = false;
          for (const cat of catKeys) {
            if (byCategory[cat][round]) {
              interleaved.push(byCategory[cat][round]);
              hasMore = true;
            }
          }
          round++;
        }

        setHeroProducts(interleaved.length > 0 ? interleaved : inStock);
      })
      .catch(() => setHeroProducts([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Autoplay 5s chuyển slide ──
  useEffect(() => {
    if (!isAutoPlay || heroProducts.length < 2) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlay, heroProducts.length]);

  // ── Tự động cuộn thanh thumbnail theo sản phẩm đang kích hoạt ──
  useEffect(() => {
    if (thumbContainerRef.current) {
      const activeThumb = thumbContainerRef.current.children[currentIndex];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [currentIndex]);

  const handleManualSelect = (index) => {
    setCurrentIndex(index);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  const handleNext = () => {
    if (heroProducts.length < 2) return;
    setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
    setIsAutoPlay(false);
  };

  const handlePrev = () => {
    if (heroProducts.length < 2) return;
    setCurrentIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
    setIsAutoPlay(false);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="w-full rounded-[2rem] bg-gradient-to-br from-orange-50 to-white flex items-center justify-center"
        style={{ minHeight: 420 }}>
        <div className="flex flex-col items-center gap-3 text-orange-400">
          <Loader2 size={40} className="animate-spin" />
          <span className="font-bold text-sm">Đang tải sản phẩm từ kho Tiger Shop...</span>
        </div>
      </div>
    );
  }

  // ── Không có sản phẩm nào ──
  if (heroProducts.length === 0) {
    return (
      <div className="w-full rounded-[2rem] bg-gradient-to-br from-orange-50 to-white flex items-center justify-center"
        style={{ minHeight: 420 }}>
        <p className="text-gray-400 font-medium">Kho hàng hiện tại chưa có sản phẩm còn hàng.</p>
      </div>
    );
  }

  const currentProduct = heroProducts[currentIndex];
  const theme          = getProductTheme(currentProduct);
  const badge          = BADGES[currentIndex % BADGES.length];
  const catLabel       = (currentProduct.category_name || currentProduct.category || "SẢN PHẨM").toUpperCase();
  const salePrice      = Number(currentProduct.price);
  const originalPrice  = Number(currentProduct.original_price || salePrice * 1.2);

  // Ảnh sản phẩm – ưu tiên field image từ DB
  const productImage = currentProduct.image
    ? (currentProduct.image.startsWith("http") ? currentProduct.image : `http://localhost:5000${currentProduct.image}`)
    : `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80&auto=format&fit=crop`;

  return (
    <div className={`relative w-full overflow-hidden rounded-[2rem] bg-gradient-to-br ${theme.bgGradient} transition-colors duration-1000 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100`}>
      {/* ── BACKGROUND DECORATIVE ── */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[100px] ${theme.glowColor} opacity-20 transition-all duration-1000`} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] bg-orange-400 opacity-10" />
      </div>

      <div className="relative z-10 w-full min-h-[550px] lg:min-h-[650px] flex flex-col lg:flex-row items-center justify-between p-8 md:p-16 lg:p-20 pb-28 md:pb-28">

        {/* ── CỘT TRÁI: TEXT & CTA ── */}
        <div className="w-full lg:w-1/2 flex flex-col items-start gap-6 pt-10 lg:pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProduct.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-start gap-5"
            >
              {/* Badge & Category */}
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 rounded-full bg-black text-white text-[10px] font-black tracking-widest uppercase shadow-md">
                  {badge}
                </span>
                <span className={`text-[11px] font-black tracking-[0.2em] ${theme.accentColor}`}>
                  {catLabel}
                </span>
                <span className="text-[11px] font-bold text-gray-400 bg-white/70 px-2 py-0.5 rounded-md border border-gray-100">
                  #{currentIndex + 1}/{heroProducts.length}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-black tracking-tight leading-[1.1] text-gray-900">
                {currentProduct.name.split(" ").slice(0, -1).join(" ")}{" "}
                <br className="hidden lg:block" />
                <span className={theme.accentColor}>{currentProduct.name.split(" ").slice(-1)}</span>
              </h1>

              {/* Description */}
              <p className="text-gray-600 text-base md:text-lg max-w-lg leading-relaxed font-medium line-clamp-3">
                {currentProduct.description || "Sản phẩm chính hãng chất lượng cao tại Tiger Shop."}
              </p>

              {/* Price */}
              <div className="flex items-end gap-4 mt-2">
                <span className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                  {fmt(salePrice)}
                </span>
                {originalPrice > salePrice && (
                  <span className="text-lg lg:text-xl text-gray-400 line-through font-bold mb-1">
                    {fmt(originalPrice)}
                  </span>
                )}
              </div>

              {/* Stock badge */}
              {Number(currentProduct.stock) <= 10 && Number(currentProduct.stock) > 0 && (
                <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  ⚠️ Chỉ còn {currentProduct.stock} sản phẩm
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 mt-4 w-full">
            {/* Nút "Mua Ngay": Chuyển đến trang chi tiết sản phẩm để xem thông tin kỹ lưỡng trước khi đặt */}
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/product/${currentProduct.id}`)}
              className="px-8 py-4 bg-[#FF8C00] hover:bg-orange-600 text-white rounded-2xl font-bold tracking-wide flex items-center gap-3 shadow-lg shadow-orange-500/30 transition-colors"
            >
              <ShoppingCart size={20} />
              Mua Ngay
            </motion.button>

            {/* Nút "Khám Phá": Chuyển vào cửa hàng (/shop) để khám phá toàn bộ các mặt hàng của shop */}
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/shop")}
              className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold tracking-wide border-2 border-gray-100 hover:border-gray-200 flex items-center gap-3 shadow-sm transition-colors"
            >
              Khám Phá
              <ArrowRight size={20} />
            </motion.button>
          </div>

          {/* USP Pills */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200/50 w-full">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              <ShieldCheck size={18} className="text-[#FF8C00]" /> Chính hãng 100%
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              <Zap size={18} className="text-[#FF8C00]" /> Hỏa tốc 2H
            </div>
          </div>
        </div>

        {/* ── CỘT PHẢI: ẢNH SẢN PHẨM LƠ LỬNG ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center h-[350px] lg:h-full relative mt-12 lg:mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProduct.id}
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
                y: [0, -15, 0],
              }}
              exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
              transition={{
                opacity: { duration: 0.6 },
                scale: { duration: 0.6, type: "spring", bounce: 0.4 },
                rotate: { duration: 0.6 },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
              className="relative w-full max-w-[450px] h-full flex items-center justify-center z-20 cursor-pointer"
              onClick={() => navigate(`/product/${currentProduct.id}`)}
              title="Bấm để xem chi tiết sản phẩm"
            >
              <div className="absolute -bottom-8 w-3/4 h-10 bg-black/10 blur-xl rounded-full" />
              <img
                src={productImage}
                alt={currentProduct.name}
                className="w-full h-auto object-contain drop-shadow-2xl max-h-[380px]"
                style={{ filter: "drop-shadow(0 25px 25px rgba(0,0,0,0.15))" }}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80";
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {heroProducts.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-0 lg:-left-10 z-30 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-orange-500 hover:scale-110 transition-all hidden md:flex"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 lg:right-0 z-30 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-orange-500 hover:scale-110 transition-all hidden md:flex"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── THUMBNAIL STRIP – Danh sách toàn bộ sản phẩm trong kho (cuộn mượt tự động) ── */}
      {heroProducts.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl">
          <div
            ref={thumbContainerRef}
            className="flex items-center gap-2.5 overflow-x-auto py-2 px-3 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-lg scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {heroProducts.map((prod, idx) => {
              const thumbImg = prod.image
                ? (prod.image.startsWith("http") ? prod.image : `http://localhost:5000${prod.image}`)
                : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&q=60";
              return (
                <button
                  key={prod.id}
                  onClick={() => handleManualSelect(idx)}
                  className={`relative shrink-0 w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 ${
                    currentIndex === idx
                      ? "bg-white shadow-md border-2 border-[#FF8C00] scale-110"
                      : "bg-transparent border-2 border-transparent hover:bg-white/50 opacity-60 hover:opacity-100"
                  }`}
                  title={`${prod.name} (${prod.category_name || prod.category || ""})`}
                >
                  <img
                    src={thumbImg}
                    alt={prod.name}
                    className="w-9 h-9 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&q=60";
                    }}
                  />
                  {currentIndex === idx && (
                    <motion.div
                      layoutId="activeThumb"
                      className="absolute inset-0 rounded-xl border-2 border-[#FF8C00]"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
