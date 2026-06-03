import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";

function SmartProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  if (!product) return null;

  const {
    id,
    name = "Sản phẩm Tiger Shop",
    price = 0,
    original_price,
    image,
    sold = 0,
    rating = 5,
    stock = 10
  } = product;

  const formatNumber = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  const discountPercent =
    original_price && original_price > price
      ? Math.round(((original_price - price) / original_price) * 100)
      : 0;

  const hasVariants = product.variants && product.variants.length > 0;
  const isOutOfStock = stock <= 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    if (hasVariants) {
      navigate(`/product/${id}`);
      return;
    }

    if (onAddToCart) onAddToCart(product);

    // Fly to cart animation
    const imgEl = e.currentTarget.closest(".premium-card")?.querySelector("img");
    const cartEl = document.querySelector(".cart-icon-nav") || document.querySelector("a[href='/cart']");

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

      clone.getBoundingClientRect(); // Trigger reflow

      clone.style.top = `${cartRect.top + cartRect.height / 2 - 10}px`;
      clone.style.left = `${cartRect.left + cartRect.width / 2 - 10}px`;
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

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          fill={i <= Math.round(rating) ? "#FFB347" : "#E2E8F0"}
          color={i <= Math.round(rating) ? "#FFB347" : "#E2E8F0"}
        />
      );
    }
    return stars;
  };

  return (
    <div className="premium-card flex flex-col h-full group bg-white border border-gray-100 shadow-sm hover:shadow-lg">
      <Link to={`/product/${id}`} className="flex flex-col h-full hover:no-underline">
        {/* IMAGE CONTAINER */}
        <div className="relative w-full pt-[100%] bg-gray-50 overflow-hidden">
          {image ? (
            <img
              src={image.startsWith('http') ? image : `http://localhost:5000/${image}`}
              alt={name}
              className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-4xl bg-gray-100">🐯</div>
          )}

          {/* Badge Tiger Choice */}
          <div className="absolute top-3 left-0 z-10 bg-[#FF8C00] text-white text-[10px] font-bold px-2.5 py-1 shadow-sm rounded-r-md">
            Tiger Choice
          </div>

          {/* Badge Discount */}
          {discountPercent > 0 && (
            <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-4 flex flex-col flex-1">
          {/* Rating stars */}
          <div className="flex items-center gap-[2px] mb-1.5">
            {renderStars()}
            <span className="text-[10px] text-gray-400 font-medium ml-1">({rating || 5}.0)</span>
          </div>

          {/* Title */}
          <h3 
            className="text-sm text-gray-800 font-bold leading-snug mb-2 group-hover:text-[#FF8C00] transition-colors"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
              height: "40px"
            }}
          >
            {name}
          </h3>

          <div className="mt-auto">
            {/* Prices */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[#FF8C00] font-black text-lg">
                <span className="text-xs mr-[1px]">₫</span>{formatNumber(price)}
              </span>
              {original_price > price && (
                <span className="text-[11px] text-gray-400 line-through">
                  ₫{formatNumber(original_price)}
                </span>
              )}
            </div>

            {/* Progress Sold bar */}
            <div className="flex flex-col gap-1 mb-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                <span>Đã bán {sold >= 1000 ? `${(sold / 1000).toFixed(1)}k` : sold}</span>
                {isOutOfStock ? (
                  <span className="text-red-500">Hết hàng</span>
                ) : (
                  <span className="text-gray-400">Kho: {stock}</span>
                )}
              </div>
              <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-gray-100">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500`}
                  style={{
                    backgroundColor: isOutOfStock ? "#CBD5E1" : "#FF8C00",
                    width: `${Math.min((sold / (sold + stock || 1)) * 100, 100)}%`,
                    minWidth: sold > 0 ? "10%" : "0%"
                  }}
                ></div>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`w-full text-white rounded-xl py-3 text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${
                isOutOfStock 
                  ? "bg-gray-300 cursor-not-allowed text-gray-500" 
                  : "bg-[#FF8C00] hover:bg-[#CC7000] hover:shadow-md hover:shadow-orange-500/10 active:scale-[0.98]"
              }`}
            >
              {isOutOfStock ? (
                "Hết Hàng"
              ) : hasVariants ? (
                "Chọn Loại"
              ) : (
                <>
                  <ShoppingCart size={14} />
                  <span>Mua Ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default SmartProductCard;
