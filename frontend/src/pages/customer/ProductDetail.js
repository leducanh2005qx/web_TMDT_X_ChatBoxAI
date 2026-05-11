import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ShoppingCart, Star, ShieldCheck, 
  Share2, Plus, Minus, Check, Heart, PawPrint
} from "lucide-react";
import {
  getProductById,
  getProductReviews,
} from "../../services/api";

function ProductDetail({ cart, setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product?.id) return;
    fetch(`http://localhost:5000/api/variants/product/${product.id}`)
      .then((res) => res.json())
      .then((data) => setVariants(Array.isArray(data) ? data : []))
      .catch(() => setVariants([]));
  }, [product]);

  useEffect(() => {
    if (!id) return;
    getProductReviews(id)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, [id]);

  const handleAddToCart = (isBuyNow = false) => {
    if (variants.length > 0 && !selectedVariant) {
      alert("Vui lòng chọn phân loại hàng!");
      return;
    }

    if (!isBuyNow) {
      // Fly animation
      const imgEl = document.querySelector(`.main-product-image`);
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
        clone.style.objectFit = "cover";
        
        document.body.appendChild(clone);
        clone.getBoundingClientRect(); // reflow

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
    }

    const cartKey = selectedVariant ? `variant-${selectedVariant.id}` : product.id;
    const exist = cart.find((i) => i.cartKey === cartKey);

    if (exist) {
      setCart(cart.map((i) => i.cartKey === cartKey ? { ...i, quantity: i.quantity + qty } : i));
    } else {
      setCart([
        ...cart,
        {
          cartKey,
          product_id: product.id,
          variant_id: selectedVariant?.id || null,
          name: product.name,
          variant_name: selectedVariant?.variant_name || null,
          price: selectedVariant?.price || product.price,
          image: product.image,
          stock: selectedVariant?.stock || product.stock,
          quantity: qty,
        },
      ]);
    }
    
    if (isBuyNow) {
       navigate('/checkout');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
        <PawPrint size={48} className="text-[#FF7A00]" />
      </motion.div>
      <span className="text-[#FF7A00] font-medium text-lg">Đang tải chân hổ...</span>
    </div>
  );
  if (!product) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
       <div className="text-6xl mb-4">🐯💤</div>
       <div className="text-xl font-bold text-gray-700 mb-2">Tiger tìm mãi không thấy gì!</div>
       <div className="text-gray-500">Sếp mua món khác nhé!</div>
       <button onClick={() => navigate("/")} className="mt-6 px-6 py-2 bg-[#FF7A00] text-white rounded-[12px] font-bold hover:bg-[#e66d00]">Quay lại Cửa Hàng</button>
    </div>
  );

  const isOutOfStock = variants.length > 0 ? selectedVariant && selectedVariant.stock <= 0 : product.stock <= 0;
  
  const currentPrice = selectedVariant?.price ?? product.price;
  const originalPrice = product.original_price;
  const discountPercent = originalPrice > currentPrice 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) 
    : 0;

  const formatNumber = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);
  const rating = product.rating ? Number(product.rating).toFixed(1) : "5.0";
  const sold = product.sold || 0;

  return (
    <div className="max-w-[1200px] mx-auto pb-24 lg:pb-10 pt-4 px-2 lg:px-0">
      {/* BREADCRUMB */}
      <div className="flex items-center text-sm text-[#FF7A00] mb-4 px-2">
        <Link to="/" className="hover:underline text-[#FF7A00]">Trang chủ</Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 lg:p-6 mb-6 flex flex-col lg:flex-row gap-8">
        {/* IMAGE SECTION */}
        <div className="w-full lg:w-[40%] flex flex-col gap-4">
          <div className="relative aspect-square w-full">
             <img 
              src={product.image?.startsWith('http') ? product.image : `http://localhost:5000/${product.image}`}
              alt={product.name}
              className="main-product-image w-full h-full object-cover border border-gray-100 rounded-[12px]"
            />
            <div 
              className="absolute top-2 left-[-2px] z-10 text-white text-[12px] font-bold px-3 py-1 shadow-sm rounded-r-md"
              style={{ backgroundColor: "#FF7A00" }}
            >
              Tiger Choice
              <div className="absolute bottom-[-2px] left-0 w-[2px] h-[2px]" style={{ backgroundColor: "#cc6200", clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}></div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
             <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                <span className="text-gray-600 text-sm">Chia sẻ:</span>
                <Share2 size={20} className="text-[#3b5998]" />
             </div>
             <div className="w-px h-6 bg-gray-200"></div>
             <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                <Heart size={24} className="text-[#ff424f]" />
                <span className="text-gray-600 text-sm">Đã thích</span>
             </div>
          </div>
        </div>

        {/* INFO SECTION */}
        <div className="w-full lg:w-[60%] flex flex-col">
          <h1 className="text-xl lg:text-[22px] font-bold text-[#222] leading-7 mb-3 break-words">
            <span className="inline-block bg-[#FF7A00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] mr-2 align-middle">TIGER CHOICE</span>
            {product.name}
          </h1>

          {/* RATING & SOLD */}
          <div className="flex items-center gap-4 text-sm mb-4">
            <div className="flex items-center text-[#FF7A00] cursor-pointer border-b border-[#FF7A00] pb-[1px]">
               <span className="font-bold text-base mr-1">{rating}</span>
               <div className="flex gap-[1px]">
                 {[1,2,3,4,5].map(i => (
                   <Star 
                     key={i} 
                     size={14} 
                     fill={i <= Math.round(Number(rating)) ? "currentColor" : "none"} 
                   />
                 ))}
               </div>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center cursor-pointer border-b border-[#222] pb-[1px]">
               <span className="font-bold text-base mr-1">{reviews.length}</span>
               <span className="text-gray-500">Đánh Giá</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center">
               <span className="font-bold text-base mr-1">{formatNumber(sold)}</span>
               <span className="text-gray-500">Đã bán</span>
            </div>
          </div>

          {/* PRICE BLOCK */}
          <div className="bg-[#f5f5f5] rounded-[12px] px-5 py-4 flex items-center gap-4 mb-6">
            {originalPrice > currentPrice && (
              <span className="text-base text-[#929292] line-through">
                ₫{formatNumber(originalPrice)}
              </span>
            )}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-[#FF7A00]">
                ₫{formatNumber(currentPrice)}
              </span>
              {discountPercent > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-[4px] uppercase">
                  {discountPercent}% GIẢM
                </span>
              )}
            </div>
          </div>

          {/* RETURN POLICY */}
          <div className="flex items-center gap-4 mb-6 text-sm">
             <span className="text-[#757575] w-24">Chính sách Trả hàng</span>
             <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#FF7A00]" />
                <span>Trả hàng 15 ngày</span>
                <span className="text-[#757575] text-xs">Đổi ý miễn phí</span>
             </div>
          </div>

          {/* VARIANTS */}
          {variants.length > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[#757575] w-24 text-sm">Phân loại</span>
              <div className="flex flex-wrap gap-2 flex-1">
                {variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const isOut = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      disabled={isOut}
                      onClick={() => setSelectedVariant(v)}
                      className={`relative px-4 py-2 text-sm border rounded-[12px] transition-colors ${
                        isSelected 
                          ? "border-[#FF7A00] text-[#FF7A00] bg-white" 
                          : "border-gray-200 text-gray-800 bg-white hover:border-[#FF7A00]"
                      } ${isOut ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
                    >
                      {v.variant_name}
                      {isSelected && (
                        <div className="absolute bottom-0 right-0 w-0 h-0 border-t-[14px] border-t-transparent border-r-[14px] border-r-[#FF7A00] rounded-br-[10px]">
                           <Check size={10} className="absolute top-[-10px] right-[-13px] text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUANTITY */}
          <div className="flex items-center gap-4 mb-8">
             <span className="text-[#757575] w-24 text-sm">Số lượng</span>
             <div className="flex items-center">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))} 
                  className="w-8 h-8 border border-gray-300 rounded-l-[12px] flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white"
                >
                  <Minus size={14}/>
                </button>
                <input 
                  type="text" 
                  value={qty} 
                  readOnly 
                  className="w-12 h-8 border-y border-gray-300 text-center text-sm font-bold focus:outline-none"
                />
                <button 
                  onClick={() => setQty(qty + 1)} 
                  className="w-8 h-8 border border-gray-300 rounded-r-[12px] flex items-center justify-center text-gray-600 hover:bg-gray-50 bg-white"
                >
                  <Plus size={14}/>
                </button>
             </div>
             <span className="text-[#757575] text-sm ml-4">
               {isOutOfStock ? "Hết hàng" : `${selectedVariant?.stock ?? product.stock} sản phẩm có sẵn`}
             </span>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4 mt-auto">
            <button 
              onClick={() => handleAddToCart(false)}
              disabled={isOutOfStock}
              className="h-14 px-6 bg-[#fffbf8] border-2 border-[#FF7A00] text-[#FF7A00] rounded-[12px] flex items-center justify-center gap-2 hover:bg-[#ffeee0] transition-colors font-bold text-base w-1/2"
            >
              <ShoppingCart size={20} />
              Thêm Vào Giỏ
            </button>
            <button 
              onClick={() => handleAddToCart(true)}
              disabled={isOutOfStock}
              className="h-14 px-6 bg-[#FF7A00] text-white rounded-[12px] font-bold text-base hover:bg-[#e66d00] transition-colors shadow-sm w-1/2"
            >
              Mua Ngay
            </button>
          </div>
        </div>
      </div>

      {/* SHOP INFO */}
      <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 lg:p-6 mb-6 flex items-center gap-6">
         <div className="w-20 h-20 rounded-full border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center bg-gray-50 text-3xl">
           🐯
         </div>
         <div className="flex flex-col gap-1 border-r border-gray-200 pr-8">
            <h3 className="font-bold text-base text-[#222]">Tiger Shop Official</h3>
            <span className="text-xs text-gray-500">Online 5 phút trước</span>
            <div className="flex gap-2 mt-2">
               <button className="border border-[#FF7A00] text-[#FF7A00] bg-[#fffbf8] px-3 py-1.5 rounded-[12px] text-xs font-bold flex items-center gap-1 hover:bg-[#ffeee0]"><ShoppingCart size={14}/> Xem Shop</button>
            </div>
         </div>
         <div className="flex-1 grid grid-cols-3 gap-y-4 px-8 text-sm text-[#757575]">
            <div className="flex justify-between w-32"><label>Đánh Giá</label><span className="text-[#FF7A00] font-bold">15,4k</span></div>
            <div className="flex justify-between w-32"><label>Sản Phẩm</label><span className="text-[#FF7A00] font-bold">243</span></div>
            <div className="flex justify-between w-32"><label>Tỉ Lệ Phản Hồi</label><span className="text-[#FF7A00] font-bold">99%</span></div>
            <div className="flex justify-between w-32"><label>Tham Gia</label><span className="text-[#FF7A00] font-bold">3 Năm</span></div>
            <div className="flex justify-between w-32"><label>Người Theo Dõi</label><span className="text-[#FF7A00] font-bold">12,1k</span></div>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[80%] flex flex-col gap-6">
          {/* DESCRIPTION */}
          <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6">
            <div className="bg-[#f5f5f5] p-3 mb-6 uppercase text-[#222] font-bold text-lg rounded-[12px]">Chi Tiết Sản Phẩm</div>
            <div className="text-base text-gray-800 leading-[1.6] whitespace-pre-wrap px-4 pb-4 font-normal">
              {product.description || "Chào mừng bạn đến với Tiger Shop. Đây là một trong những sản phẩm được yêu thích nhất của chúng tôi với chất lượng vượt trội và thiết kế hiện đại."}
            </div>
          </div>

          {/* REVIEWS */}
          <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6">
            <div className="text-lg font-bold uppercase text-[#222] mb-4">Đánh Giá Sản Phẩm</div>
            
            {/* RATING OVERVIEW */}
            <div className="bg-[#fffbf8] border border-[#f9ede5] p-8 flex items-center gap-8 mb-6 rounded-[12px]">
               <div className="flex flex-col items-center justify-center">
                  <div className="text-3xl text-[#FF7A00] font-bold">
                    <span className="text-5xl">
                      {reviews.length > 0 
                        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                        : "5.0"}
                    </span> trên 5
                  </div>
                  <div className="flex text-[#FF7A00] mt-2 gap-1">
                     {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
                  </div>
               </div>
               <div className="flex flex-wrap gap-2 flex-1">
                  <button className="border border-[#FF7A00] text-[#FF7A00] bg-white px-4 py-1.5 text-sm font-bold rounded-[12px]">Tất Cả ({reviews.length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">5 Sao ({reviews.filter(r => r.rating === 5).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">4 Sao ({reviews.filter(r => r.rating === 4).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">3 Sao ({reviews.filter(r => r.rating === 3).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">2 Sao ({reviews.filter(r => r.rating === 2).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">1 Sao ({reviews.filter(r => r.rating === 1).length})</button>
                  <button className="border border-gray-200 text-[#222] bg-white px-4 py-1.5 text-sm rounded-[12px]">Có Bình Luận ({reviews.filter(r => r.comment).length})</button>
               </div>
            </div>

            <div className="flex flex-col">
               {reviews.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 text-sm">Chưa có đánh giá nào cho sản phẩm này.</div>
               ) : (
                 reviews.map(r => (
                   <div key={r.id} className="border-b border-gray-100 py-4 flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 overflow-hidden shrink-0">
                         {r.user_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex flex-col flex-1">
                         <span className="text-xs text-[#222] font-bold">{r.user_name}</span>
                         <div className="flex text-[#FF7A00] mt-1 mb-2">
                           {Array.from({length: r.rating}).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                           {Array.from({length: 5 - r.rating}).map((_, i) => <Star key={i} size={12} color="#FF7A00" />)}
                         </div>
                         <div className="text-xs text-[#8a8a8a] mb-3">
                           {new Date(r.created_at).toLocaleDateString("vi-VN", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}
                         </div>
                         <p className="text-sm text-[#222] leading-[1.6] mb-3">{r.comment}</p>
                         <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                            <span className="cursor-pointer hover:text-gray-600 flex items-center gap-1">Hữu ích?</span>
                         </div>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProductDetail;
