import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, MapPin, Star } from "lucide-react";

export default function SmartProductCard({ product, onAddToCart }) {
  if (!product) return null;

  const {
    id,
    name = "Sản phẩm Tiger Shop",
    price = 0,
    original_price,
    image,
    sold_count = 0,
    stock = 10
  } = product;

  const formatNumber = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  const discountPercent =
    original_price && original_price > price
      ? Math.round(((original_price - price) / original_price) * 100)
      : 0;

  const isOutOfStock = stock <= 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    if (onAddToCart) onAddToCart(product);
  };

  const getImageUrl = (img) => {
    if (!img) return "/placeholder.png";
    if (img.startsWith("http")) return img;
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    if (img.startsWith("/")) return `${baseUrl}${img}`;
    return `${baseUrl}/${img}`;
  };

  return (
    <Link 
      to={`/product/${id}`} 
      className="group block border border-gray-100 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow relative flex flex-col h-full no-underline text-inherit hover:text-inherit hover:no-underline"
    >
      {/* Hình ảnh */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        <img
          src={getImageUrl(image)}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
        />

        {/* Badge Tiger Choice (Góc trái trên) */}
        <div className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-10">
          Tiger Choice
        </div>

        {/* Badge Giảm giá (Góc phải trên) */}
        {discountPercent > 0 && (
          <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm z-10">
            -{discountPercent}%
          </div>
        )}

        {/* Nút giỏ hàng (Góc phải dưới của ảnh) */}
        {!isOutOfStock && (
          <button 
            onClick={handleQuickAdd}
            className="absolute bottom-2 right-2 w-9 h-9 bg-white text-[#FF8C00] rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-orange-50 z-20"
            title="Thêm nhanh vào giỏ"
          >
            <ShoppingCart size={16} />
          </button>
        )}
        {isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-bold py-1.5 text-center">
            HẾT HÀNG
          </div>
        )}
      </div>

      {/* Thông tin thẻ */}
      <div className="p-3 flex flex-col flex-1">
        {/* 5 Ngôi sao vàng */}
        <div className="flex gap-[2px] mb-1">
          {Array(5).fill(0).map((_, i) => (
            <Star key={i} size={10} fill="currentColor" className="text-yellow-400" />
          ))}
        </div>

        {/* Tên SP */}
        <h3 className="text-sm text-gray-800 font-medium line-clamp-2 leading-snug mb-1 no-underline flex-1">
          {name}
        </h3>
        
        {/* Giá tiền */}
        <div className="flex items-baseline mt-1">
          <span className="text-orange-500 font-bold text-lg mr-2">
            {formatNumber(price)}đ
          </span>
          {discountPercent > 0 && (
            <span className="text-gray-400 text-sm line-through">
              {formatNumber(original_price)}đ
            </span>
          )}
        </div>

        {/* Footer thẻ */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center text-[11px] text-gray-500">
            <MapPin size={10} className="mr-0.5" />
            Hà Nội
          </div>
          <div className="text-[11px] text-gray-500">
            {Number(sold_count) > 0 ? `Đã bán ${sold_count}` : "Chưa có lượt mua"}
          </div>
        </div>
      </div>
    </Link>
  );
}
