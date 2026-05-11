import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

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
    rating = 5 // Mặc định 5 sao cho đẹp
  } = product;

  const formatNumber = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  const discountPercent =
    original_price && original_price > price
      ? Math.round(((original_price - price) / original_price) * 100)
      : 0;

  const hasVariants = product.variants && product.variants.length > 0;
  const isOutOfStock = product.stock <= 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    if (hasVariants) {
      navigate(`/product/${id}`);
      return;
    }

    if (onAddToCart) onAddToCart(product);

    // Hiệu ứng bay vào giỏ hàng
    const imgEl = e.currentTarget.closest(".relative.group")?.querySelector("img");
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
      clone.style.border = "4px solid #FF7A00";
      clone.style.zIndex = "9999";
      clone.style.transition = "all 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
      clone.style.pointerEvents = "none";
      
      document.body.appendChild(clone);

      clone.getBoundingClientRect(); // Trigger reflow

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

  // Render 5 sao
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={10}
          fill={i <= Math.round(rating) ? "#ffce3d" : "#e0e0e0"}
          color={i <= Math.round(rating) ? "#ffce3d" : "#e0e0e0"}
        />
      );
    }
    return stars;
  };

  return (
    <div
      className="relative group bg-white rounded-[12px] overflow-hidden flex flex-col h-full border border-transparent hover:border-[#FF7A00]"
      style={{
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.05)";
      }}
    >
      <Link to={`/product/${id}`} className="flex flex-col h-full hover:no-underline">
        {/* IMAGE CONTAINER (Tỷ lệ 1:1 vuông vức) */}
        <div className="relative w-full pt-[100%] bg-gray-50 overflow-hidden">
          {image ? (
            <img
              src={image.startsWith('http') ? image : `http://localhost:5000/${image}`}
              alt={name}
              className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-4xl">🐯</div>
          )}

          {/* Badge Tiger Choice màu cam góc trái */}
          <div 
            className="absolute top-2 left-[-2px] z-10 text-white text-[10px] font-bold px-2 py-0.5 shadow-sm rounded-r-md"
            style={{ 
              backgroundColor: "#FF7A00", 
            }}
          >
            Tiger Choice
            <div className="absolute bottom-[-2px] left-0 w-[2px] h-[2px]" style={{ backgroundColor: "#cc6200", clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}></div>
          </div>

          {/* Badge % Giảm giá góc phải trên */}
          {discountPercent > 0 && (
            <div 
              className="absolute top-2 right-2 z-10 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm"
            >
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-3 flex flex-col flex-1">
          {/* Tiêu đề giới hạn 2 dòng */}
          <h3 
            className="text-xs text-[#222] font-medium leading-[18px] mb-2"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
              height: "36px"
            }}
          >
            {name}
          </h3>

          <div className="mt-auto">
            {/* Đánh giá 5 sao */}
            <div className="flex items-center gap-[2px] mb-2">
              {renderStars()}
            </div>

            {/* Khu vực 2 Giá */}
            <div className="flex flex-col mb-2">
              {/* Giá gốc gạch ngang */}
              {original_price > price ? (
                <div className="text-[11px] text-[#929292] line-through leading-none mb-1">
                  ₫{formatNumber(original_price)}
                </div>
              ) : (
                <div className="h-[11px] mb-1"></div> // Khung giữ chỗ để thẻ không bị lệch
              )}

              {/* Giá bán màu cam in đậm */}
              <div className="text-[#FF7A00] font-bold text-base leading-none">
                <span className="text-xs mr-[1px]">₫</span>{formatNumber(price)}
              </div>
            </div>

            {/* Thanh tiến độ Đã bán & Nút Mua Ngay */}
            <div className="flex flex-col mt-3">
              {/* Sold Bar (thanh mảnh) */}
              <div className="relative w-full h-[6px] rounded-full overflow-hidden bg-gray-200 mb-2">
                <div 
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    backgroundColor: "#FF7A00",
                    width: `${Math.min((sold / 100) * 100, 100)}%`, // Giả lập phần trăm thanh đã bán
                    minWidth: "10%"
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center w-full mb-3">
                <span className="text-xs text-gray-500 font-medium">Đã bán {sold >= 1000 ? `${(sold / 1000).toFixed(1)}k` : sold}</span>
              </div>
              <button
                onClick={handleQuickAdd}
                disabled={isOutOfStock}
                className={`w-full text-white rounded-[12px] px-4 py-2.5 text-[14px] lg:text-[16px] font-bold transition-colors shadow-sm flex items-center justify-center gap-2 ${
                  isOutOfStock ? "bg-gray-400 cursor-not-allowed" : "bg-[#FF7A00] hover:bg-[#e66d00]"
                }`}
              >
                {isOutOfStock ? "Hết Hàng" : hasVariants ? "Chọn Loại" : "Mua Ngay"}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default SmartProductCard;
