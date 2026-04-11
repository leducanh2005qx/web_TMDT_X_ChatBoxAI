import React from "react";
import { Link } from "react-router-dom";

function SmartProductCard({ product }) {
  if (!product) return null;

  const {
    id,
    name = "Sản phẩm Tiger Shop",
    price = 0,
    original_price,
    image_url,
    sold = 0,
    display_type = "general",
    specifications = {}
  } = product;

  // Hàm format hiển thị số (chỉ lấy phần số để tự ghép chữ ₫)
  const formatNumber = (p) => {
    return new Intl.NumberFormat("vi-VN").format(p || 0);
  };

  // Tính phần trăm giảm giá (nếu có)
  const discountPercent =
    original_price && original_price > price
      ? Math.round(((original_price - price) / original_price) * 100)
      : 0;

  // Hiển thị nhãn động dựa vào loại sản phẩm (display_type)
  const renderDynamicBadge = () => {
    switch (display_type) {
      case "electronics":
        const ram = specifications?.ram || "8GB";
        const storage = specifications?.storage || specifications?.rom || "256GB";
        return (
          <div className="absolute bottom-1 left-1 bg-gray-100/90 text-gray-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-gray-200">
            {ram}/{storage}
          </div>
        );

      case "fashion":
        const colors = specifications?.colors || ["#000000", "#7f1d1d", "#d1d5db"];
        return (
          <div className="absolute bottom-1 left-1 flex gap-1">
            {colors.slice(0, 3).map((c, i) => (
              <div
                key={i}
                className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: c }}
              ></div>
            ))}
          </div>
        );

      case "food":
        return (
          <div className="absolute top-2 left-[-4px] bg-[#00bfa5] text-white text-[10px] font-bold px-2 py-0.5 rounded-r-md shadow-sm before:content-[''] before:absolute before:-bottom-1 before:left-0 before:border-l-4 before:border-l-transparent before:border-t-4 before:border-t-[#00796b]">
            ⚡ Giao nhanh 15p
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Link
      to={`/product/${id}`}
      className="group block bg-white hover:-translate-y-0.5 transition-transform duration-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_8px_0_rgba(0,0,0,0.1)] border border-transparent hover:border-[#ee4d2d]/30 overflow-hidden relative break-words"
    >
      {/* Vùng Ảnh SP: Square Tỷ lệ 1:1 */}
      <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
          />
        ) : (
          <span className="text-gray-300 text-3xl">🐯</span>
        )}

        {/* Dynamic Badge render (Electronics / Fashion / Food) */}
        {renderDynamicBadge()}

        {/* Nhãn Giảm Giá của Shopee */}
        {discountPercent > 0 && (
          <div className="absolute top-0 right-0 bg-yellow-400 bg-opacity-90 w-9 h-10 flex flex-col items-center justify-center z-10 clip-path-shopee-discount">
            <span className="text-[#ee4d2d] leading-none font-bold text-[11px] pt-1">
              {discountPercent}%
            </span>
            <span className="text-white leading-none font-bold text-[10px] uppercase pb-1">
              Giảm
            </span>
            {/* Tạo góc nhọn kiểu Ribbon (bằng CSS tam giác ở bottom) */}
            <div className="absolute -bottom-1 left-0 w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[4px] border-t-yellow-400"></div>
          </div>
        )}
      </div>

      {/* Vùng Thông Tin SP */}
      <div className="p-2 pb-2.5 flex flex-col gap-1.5 min-h-[85px] bg-white">
        {/* Tên SP - line-clamp-2 để tối đa 2 dòng */}
        <h3
          className="text-xs text-gray-800 leading-[1.3] h-[31px] font-normal"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {name}
        </h3>

        {/* Vùng Giá và Đã Bán */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="text-[#ee4d2d] font-medium text-base truncate flex items-center">
            <span className="text-[10px] mr-px mb-0.5 underline decoration-1 underline-offset-1">
              đ
            </span>
            <span>{formatNumber(price)}</span>
          </div>

          <div className="text-[10px] text-gray-500 truncate pl-1">
            Đã bán {sold > 1000 ? `${(sold / 1000).toFixed(1)}k` : sold}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default SmartProductCard;
