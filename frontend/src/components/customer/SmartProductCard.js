import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function SmartProductCard({ product, onAddToCart }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  if (!product) return null;

  const {
    id,
    name = "Sản phẩm Tiger Shop",
    price = 0,
    original_price,
    image,
    sold = 0,
    display_type = "general",
    rating = 4.8
  } = product;

  const formatNumber = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  const discountPercent =
    original_price && original_price > price
      ? Math.round(((original_price - price) / original_price) * 100)
      : 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart(product);

    // Get the image element and cart icon element
    const imgEl = e.currentTarget.closest(".relative.group").querySelector("img");
    const cartEl = document.querySelector(".cart-icon-nav");

    if (imgEl && cartEl) {
      const imgRect = imgEl.getBoundingClientRect();
      const cartRect = cartEl.getBoundingClientRect();

      const clone = imgEl.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.top = `${imgRect.top}px`;
      clone.style.left = `${imgRect.left}px`;
      clone.style.width = `${imgRect.width}px`;
      clone.style.height = `${imgRect.height}px`;
      clone.style.borderRadius = "50%";
      clone.style.border = "4px solid #FF8C00";
      clone.style.zIndex = "9999";
      clone.style.transition = "all 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
      clone.style.pointerEvents = "none";
      
      document.body.appendChild(clone);

      // Trigger reflow
      clone.getBoundingClientRect();

      clone.style.top = `${cartRect.top + cartRect.height / 2}px`;
      clone.style.left = `${cartRect.left + cartRect.width / 2}px`;
      clone.style.width = "20px";
      clone.style.height = "20px";
      clone.style.opacity = "0.2";

      setTimeout(() => {
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
      }, 800);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <Link to={`/product/${id}`} className="flex flex-col h-full">
        {/* IMAGE CONTAINER */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {image ? (
            <motion.img
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.4 }}
              src={image.startsWith('http') ? image : `http://localhost:5000/${image}`}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🐯</div>
          )}

          {/* BADGES */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {discountPercent > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                -{discountPercent}%
              </span>
            )}
            {sold > 500 && (
              <span className="bg-[#FF8C00] text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                <Zap size={10} fill="currentColor" /> BÁN CHẠY
              </span>
            )}
          </div>

          {/* QUICK ACTION OVERLAY */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                className="absolute inset-0 bg-black/5 flex items-end p-4 justify-center"
              >
                <button
                  onClick={handleQuickAdd}
                  className="w-full glass py-3 rounded-xl flex items-center justify-center gap-2 text-[#333] font-bold text-sm shadow-lg hover:bg-white transition-all active:scale-95"
                >
                  <ShoppingCart size={18} />
                  <span>THÊM NHANH</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          

        </div>

        {/* CONTENT */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star size={12} fill="currentColor" />
            <span className="text-[10px] font-bold text-gray-500">{rating}</span>
          </div>

          <h3 className="text-sm font-bold text-[#333] line-clamp-2 leading-snug h-10">
            {name}
          </h3>

          <div className="mt-auto flex items-end justify-between">
            <div className="flex flex-col">
              {original_price > price && (
                <span className="text-[10px] text-gray-400 line-through">
                  {formatNumber(original_price)}đ
                </span>
              )}
              <span className="text-[#FF8C00] font-black text-lg leading-none">
                {formatNumber(price)}<span className="text-xs ml-0.5">đ</span>
              </span>
            </div>
            <span className="text-[10px] font-medium text-gray-400">
              Đã bán {sold > 1000 ? `${(sold / 1000).toFixed(1)}k` : sold}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default SmartProductCard;
