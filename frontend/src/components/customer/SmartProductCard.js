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
    image_url,
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
    setIsFlying(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => setIsFlying(false), 800);
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
          {image_url ? (
            <motion.img
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.4 }}
              src={image_url}
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
          
          {/* FLYING EFFECT CLONE */}
          <AnimatePresence>
            {isFlying && (
              <motion.div
                initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
                animate={{ 
                  scale: 0.2, 
                  x: window.innerWidth > 1024 ? 400 : 0, // Fly towards desktop cart or mobile bottom cart
                  y: window.innerWidth > 1024 ? -600 : 600,
                  opacity: 0 
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 z-50 pointer-events-none"
              >
                <img src={image_url} alt="flying" className="w-full h-full object-cover rounded-full border-4 border-[#FF8C00]" />
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
