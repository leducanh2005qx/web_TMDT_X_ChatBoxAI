import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ShoppingCart, Star, ShieldCheck, 
  Truck, ArrowRight, Share2, Plus, Minus
} from "lucide-react";
import {
  getProductById,
  getProductReviews,
  submitProductReview,
} from "../../services/api";

function ProductDetail({ cart, setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [myReviewImage, setMyReviewImage] = useState(null);
  const [qty, setQty] = useState(1);
  const [isFlying, setIsFlying] = useState(false);

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

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      alert("Vui lòng chọn loại sản phẩm!");
      return;
    }

    const imgEl = document.querySelector(`.aspect-square img`);
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
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-4xl">🐯</motion.div>
    </div>
  );
  if (!product) return <div className="text-center p-20 font-bold">Không tìm thấy sản phẩm</div>;

  const isOutOfStock = variants.length > 0 ? selectedVariant && selectedVariant.stock <= 0 : product.stock <= 0;

  return (
    <div className="flex flex-col gap-8 pb-24 lg:pb-0">
      {/* MOBILE HEADER BAR */}
      <div className="lg:hidden flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm"><ChevronLeft /></button>
        <div className="flex gap-2">
          <button className="p-2 bg-white rounded-full shadow-sm"><Share2 size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* IMAGE GALLERY */}
        <div className="relative group">
          <motion.div 
            layoutId={`product-image-${product.id}`}
            className="aspect-square rounded-[2rem] overflow-hidden bg-white shadow-sm border border-gray-100"
          >
            <img 
              src={product.image?.startsWith('http') ? product.image : `http://localhost:5000/${product.image}`}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>

        {/* INFO PANEL */}
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-orange-100 text-[#FF8C00] text-[10px] font-black px-2 py-1 rounded">PREMIUM</span>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-bold text-gray-800">4.9</span>
                <span className="text-xs text-gray-400 font-medium">(250 đánh giá)</span>
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#333] tracking-tight">{product.name}</h1>
            <p className="text-3xl font-black text-[#FF8C00]">{(selectedVariant?.price ?? product.price).toLocaleString()}đ</p>
          </header>

          {/* VARIANTS */}
          {variants.length > 0 && (
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Phân loại hàng</h4>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    disabled={v.stock <= 0}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all ${selectedVariant?.id === v.id ? "bg-[#FF8C00] text-white border-transparent" : "bg-white border-gray-200 hover:border-[#FF8C00]"} ${v.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {v.variant_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QUANTITY */}
          <div className="flex flex-col gap-3">
             <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Số lượng</h4>
             <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-white rounded-lg transition-all"><Minus size={16}/></button>
                  <span className="w-10 text-center font-black">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="p-2 hover:bg-white rounded-lg transition-all"><Plus size={16}/></button>
                </div>
                <span className="text-xs font-medium text-gray-400">
                  {isOutOfStock ? "Hết hàng" : `Còn lại: ${selectedVariant?.stock ?? product.stock} món`}
                </span>
             </div>
          </div>

          <div className="h-px bg-gray-100 my-2" />

          {/* BENEFITS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
               <Truck className="text-green-500" size={18} /> Giao hàng siêu tốc
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
               <ShieldCheck className="text-blue-500" size={18} /> Chính hãng 100%
            </div>
          </div>

          {/* DESKTOP ACTIONS */}
          <div className="hidden lg:flex gap-4 mt-4">
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 tiger-btn py-4 text-lg shadow-tiger"
            >
              <ShoppingCart size={20} /> MUA NGAY
            </button>

          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <div className="w-1 h-6 bg-[#FF8C00] rounded-full" /> CHI TIẾT SẢN PHẨM
        </h3>
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {product.description || "Chào mừng bạn đến với Tiger Shop. Đây là một trong những sản phẩm được yêu thích nhất của chúng tôi với chất lượng vượt trội và thiết kế hiện đại."}
        </p>
      </section>

      {/* REVIEWS */}
      <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <div className="w-1 h-6 bg-[#FF8C00] rounded-full" /> ĐÁNH GIÁ TỪ KHÁCH HÀNG
        </h3>
        
        <div className="flex flex-col gap-6">
           {reviews.length === 0 ? (
             <div className="text-center py-10 text-gray-400 italic">Chưa có đánh giá nào cho sản phẩm này.</div>
           ) : (
             reviews.map(r => (
               <div key={r.id} className="border-b border-gray-50 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-[#FF8C00]">{r.user_name?.[0]}</div>
                       <div>
                         <p className="text-sm font-bold">{r.user_name}</p>
                         <div className="flex text-yellow-500">{"⭐".repeat(r.rating)}</div>
                       </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 uppercase">10/10/2026</span>
                  </div>
                  <p className="text-sm text-gray-600 pl-13">{r.comment}</p>
               </div>
             ))
           )}
        </div>
      </section>

      {/* MOBILE STICKY ACTIONS */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex gap-4 z-50 pb-20">
        <button 
           onClick={handleAddToCart}
           disabled={isOutOfStock}
           className="flex-1 tiger-btn py-4 text-sm"
        >
          {isOutOfStock ? "HẾT HÀNG" : "MUA NGAY"}
        </button>
      </div>
    </div>
  );
}

export default ProductDetail;
