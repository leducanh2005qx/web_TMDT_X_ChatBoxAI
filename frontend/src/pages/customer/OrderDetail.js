import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrderById, cancelOrderCustomer, updateOrderStatus, requestReturnWarranty, submitProductReview } from "../../services/api";
import { ChevronLeft, MapPin, PawPrint, Star, Camera, CreditCard, Award } from "lucide-react";

function OrderDetail({ cart = [], setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Review states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProductId, setReviewProductId] = useState(null);
  const [reviewProductName, setReviewProductName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewProductId || reviewProductId === "null" || reviewProductId === null) {
      alert("⚠️ Sản phẩm này đã bị xóa hoặc không còn tồn tại trên hệ thống, không thể gửi đánh giá sếp ơi!");
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) return alert("Vui lòng chọn số sao từ 1 đến 5");
    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append("rating", reviewRating);
      formData.append("comment", reviewComment);
      if (reviewImage) {
        formData.append("image", reviewImage);
      }
      await submitProductReview(reviewProductId, formData);
      alert("🎉 Cảm ơn sếp đã gửi đánh giá cho sản phẩm!");
      setShowReviewModal(false);
      setReviewComment("");
      setReviewImage(null);
      setReviewRating(5);
      window.location.reload();
    } catch (err) {
      alert("Lỗi gửi đánh giá: " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReorder = () => {
    if (!order || !order.items || order.items.length === 0) {
      alert("⚠️ Đơn hàng này không có sản phẩm nào hợp lệ để mua lại!");
      return;
    }
    const newCart = [...cart];
    order.items.forEach(item => {
      if (!item.product_id) return;
      const cartKey = item.variant_name ? `variant-name-${item.variant_name}` : String(item.product_id);
      const existIdx = newCart.findIndex(i => i.cartKey === cartKey);
      if (existIdx > -1) {
        newCart[existIdx].quantity += item.quantity || 1;
      } else {
        newCart.push({
          cartKey,
          product_id: item.product_id,
          variant_id: null,
          name: item.name || "Sản phẩm Tiger Shop",
          variant_name: item.variant_name || null,
          price: item.price || 0,
          image: item.image || null,
          stock: 99,
          quantity: item.quantity || 1
        });
      }
    });
    setCart(newCart);
    alert("🎉 Đã thêm tất cả sản phẩm của đơn hàng vào giỏ hàng! Đang chuyển hướng tới giỏ hàng của sếp...");
    navigate("/cart");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = String(user.role || "").toUpperCase();

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;
    setCancelling(true);
    try {
      await cancelOrderCustomer(id);
      alert("Đã hủy đơn hàng thành công");
      window.location.reload();
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleUpdateStatus = async (newStatus, actionName) => {
    if (!window.confirm(`Xác nhận ${actionName} cho đơn hàng này?`)) return;
    setConfirming(true);
    try {
      await updateOrderStatus(id, newStatus);
      alert(`${actionName} thành công!`);
      window.location.reload();
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!returnReason.trim()) return alert("Vui lòng nhập lý do.");
    setSubmittingReturn(true);
    try {
      await requestReturnWarranty(id, returnReason);
      alert("Yêu cầu của bạn đã được gửi thành công!");
      setShowReturnModal(false);
      setReturnReason("");
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setSubmittingReturn(false);
    }
  };

  useEffect(() => {
    getOrderById(id)
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => {
        console.error("Lỗi lấy đơn hàng:", err);
        alert("Không lấy được chi tiết đơn hàng");
        navigate("/orders");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#f8fafc] gap-4">
      <div className="animate-spin text-[#FF7A00]"><PawPrint size={48} fill="#FF7A00" /></div>
      <span className="text-[#FF7A00] font-extrabold text-lg tracking-wide">TIGER SHOP ĐANG TẢI...</span>
    </div>
  );

  if (!order) return null;

  const isCustomer = userRole === "CUSTOMER" || userRole === "";
  const isStaff = ["STAFF", "MANAGER", "ADMIN"].includes(userRole);
  const status = order.status?.toLowerCase() || 'pending';
  
  const getStatusText = (s) => {
    switch(s) {
      case "pending": return "Chờ xác nhận";
      case "confirmed": return "Đã soạn xong";
      case "shipping": return "Đang giao hàng";
      case "completed": return "Giao hàng thành công";
      case "cancelled": return "Đã hủy";
      default: return s?.toUpperCase();
    }
  };

  const method = String(order.payment_method || "cod").toLowerCase().trim();
  const isQR = method === "qr" || method === "banking qr";
  const methodText = isQR ? "Chuyển khoản VietQR siêu tốc" : "Thanh toán khi nhận hàng (COD)";

  const formatNumber = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  // Dynamic Emojis for steps
  const steps = [
    { key: 'pending', label: 'Đã Đặt', emoji: '🐾', desc: 'Đơn hàng thành công' },
    { key: 'confirmed', label: 'Đã Xác Nhận', emoji: '🐅', desc: 'Đang soạn hàng' },
    { key: 'shipping', label: 'Đang Giao', emoji: '🛵', desc: 'Shipper đang giao' },
    { key: 'completed', label: 'Đã Giao', emoji: '🐯', desc: 'Giao hàng thành công' }
  ];

  const getActiveStepIndex = () => {
    if (status === 'cancelled') return -1;
    if (status === 'pending') return 0;
    if (status === 'confirmed') return 1;
    if (status === 'shipping') return 2;
    if (status === 'completed') return 3;
    return 0;
  };

  const activeStep = getActiveStepIndex();

  // Dynamic calculations for subtotal & shipping details
  const itemsArray = Array.isArray(order.items) ? order.items : [];
  const subtotal = itemsArray.reduce((acc, curr) => acc + Number(curr.price || 0) * Number(curr.quantity || 1), 0);
  
  // Math-based heuristic to check if express shipping was chosen
  // If the total order price minus subtotal is high (>= 50k), it is Express!
  const isExpress = (order.total - subtotal) >= 50000 || order.shipping_fee >= 50000;
  
  // Define shipping fee and discount dynamically
  const shippingFee = isExpress ? 80000 : 30000;
  const discount = Math.max((subtotal + shippingFee) - order.total, 0);

  return (
    <>
    <div className="bg-[#f8fafc] min-h-screen pb-24 pt-6">
      <div className="max-w-[850px] mx-auto px-4 flex flex-col gap-6">
        
        {/* HEADER BAR */}
        <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row items-center justify-between p-5 gap-4">
           <button 
             onClick={() => navigate("/orders")} 
             className="flex items-center text-xs font-black text-slate-500 hover:text-[#FF7A00] transition-colors gap-1.5 uppercase"
           >
              <ChevronLeft size={16}/> Quay lại danh sách
           </button>
           <div className="flex items-center gap-3 text-xs sm:text-sm font-bold flex-wrap justify-center">
              <span className="text-slate-800 font-extrabold bg-slate-100 px-3 py-1 rounded-[8px]">ĐƠN HÀNG: #{order.orderId || order.id}</span>
              <span className="text-slate-300">|</span>
              <span className={`px-3 py-1 rounded-full font-black uppercase text-[11px] ${
                status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                status === 'shipping' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                status === 'confirmed' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                status === 'cancelled' ? 'bg-red-50 text-red-600 border border-red-200' :
                'bg-orange-50 text-[#FF7A00] border border-orange-200'
              }`}>
                {getStatusText(status)}
              </span>
           </div>
        </div>

        {/* TIMELINE PROGRESS STATUS */}
        {status !== 'cancelled' && (
          <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 p-6 sm:p-10 flex flex-col gap-8 relative overflow-hidden">
             
             {/* Progress connecting line container */}
             <div className="absolute top-[64px] left-[12.5%] right-[12.5%] h-1.5 bg-slate-100 rounded-full z-0 hidden sm:block"></div>
             {activeStep >= 0 && (
               <div 
                 className="absolute top-[64px] left-[12.5%] h-1.5 bg-[#FF7A00] rounded-full z-1 transition-all duration-1000 ease-out hidden sm:block" 
                 style={{ width: `${(activeStep / (steps.length - 1)) * 75}%` }}
               ></div>
             )}
             
             {/* Steps list */}
             <div className="flex flex-col sm:flex-row justify-between items-stretch gap-6 sm:gap-0 relative z-10">
               {steps.map((step, idx) => {
                 const isCompleted = idx <= activeStep;
                 const isCurrent = idx === activeStep;
                 return (
                   <div key={idx} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-3 w-full sm:w-1/4">
                      {/* Emoji badge wrapper */}
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 text-4xl shadow-sm transition-all duration-300 relative flex-shrink-0 ${
                        isCurrent ? 'bg-white border-[#FF7A00] scale-110 ring-4 ring-[#FF7A00]/10' : 
                        isCompleted ? 'bg-white border-[#FF7A00]' : 'bg-white border-slate-200'
                      }`}>
                         {step.emoji}
                         {isCurrent && (
                           <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7A00] opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FF7A00]"></span>
                           </span>
                         )}
                      </div>
                      
                      <div className="flex flex-col sm:items-center">
                         <span className={`text-sm font-extrabold ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                           {step.label}
                         </span>
                         <span className="text-[10px] text-slate-400 mt-0.5 font-medium">{step.desc}</span>
                      </div>
                   </div>
                 );
               })}
             </div>
          </div>
        )}

        {/* CANCELLED WARNING */}
        {status === 'cancelled' && (
          <div className="bg-red-50/50 p-6 sm:p-8 rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-red-100 flex flex-col items-center justify-center text-center">
             <div className="text-5xl mb-3 animate-pulse">😿</div>
             <h3 className="text-xl text-red-600 font-black mb-1">Đơn hàng đã được hủy bỏ</h3>
             <p className="text-xs text-red-400 max-w-md leading-relaxed">
               Đơn hàng này đã được hủy bỏ thành công. Nếu sếp cần mua lại các sản phẩm này, hãy click vào nút <strong>"Mua Lại"</strong> phía dưới để giỏ hàng được lấp đầy tức thì nhé!
             </p>
          </div>
        )}

        {/* ADRESS & SHIPPING BLOCK */}
        <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 p-6 relative pt-4 overflow-hidden">
           {/* Decorative TikTok Shop striped boundary */}
           <div className="absolute top-0 left-0 w-full h-[4px]" style={{ background: 'repeating-linear-gradient(45deg,#6fa6d6,#6fa6d6 33px,transparent 0,transparent 41px,#FF7A00 0,#FF7A00 74px,transparent 0,transparent 82px)' }}></div>
           
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[#FF7A00] font-black text-base border-b border-slate-50 pb-3 mt-1">
                <MapPin size={18} fill="#FF7A00" className="text-white" />
                <span>Địa Chỉ Nhận Hàng</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-sm">
                   <span className="font-extrabold text-slate-800 text-base">{order.receiver_name || "Đức Anh"}</span>
                   <span className="text-slate-500 font-bold">{order.receiver_phone || "Không có số điện thoại"}</span>
                   <span className="text-slate-400 font-medium leading-relaxed mt-1">{order.shipping_address}</span>
                </div>

                <div className="flex flex-col justify-center sm:border-l sm:border-slate-50 sm:pl-6">
                   <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Hình thức vận chuyển</span>
                   {isExpress ? (
                     <div className="flex flex-col gap-1 bg-[#fff7f0] border border-[#ffe4cc] text-[#FF7A00] px-4 py-3 rounded-[12px]">
                       <span className="font-black text-sm flex items-center gap-1">🐾 Hỏa tốc 🐾</span>
                       <span className="text-[10px] text-slate-500 font-medium">Nhận hàng siêu tốc nội thành cùng Tiger Express!</span>
                     </div>
                   ) : (
                     <div className="flex flex-col gap-1 bg-slate-50 border border-slate-100 text-slate-600 px-4 py-3 rounded-[12px]">
                       <span className="font-black text-sm flex items-center gap-1">🚚 Giao hàng tiêu chuẩn 🚚</span>
                       <span className="text-[10px] text-slate-400 font-medium">Nhận hàng an toàn từ 2 - 3 ngày làm việc.</span>
                     </div>
                   )}
                </div>
              </div>
           </div>
        </div>

        {/* PRODUCTS DETAILS LIST (Cart format) */}
        <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col overflow-hidden">
           <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                 <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-[4px] tracking-wide">TIGER SHOP OFFICIAL</span>
                 <span className="font-extrabold text-sm text-slate-700">Đơn hàng của Tiger Shop</span>
              </div>
              <button className="flex items-center gap-1 bg-white border border-[#FF7A00]/30 text-[#FF7A00] px-3 py-1 rounded-[12px] text-xs font-bold hover:bg-[#fffbf8] transition-colors shadow-sm">
                 <span>💬</span> Chat với Shop
              </button>
           </div>

           <div className="flex flex-col p-5 gap-5 divide-y divide-slate-50">
              {itemsArray.length > 0 ? (
                itemsArray.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start pt-4 first:pt-0">
                     <div className="relative flex-shrink-0">
                        <img 
                           src={item?.image ? (item.image.startsWith('http') ? item.image : `http://localhost:5000/${item.image.replace(/^\/+/, '')}`) : `https://picsum.photos/id/${(item.product_id * 17) % 1000}/200/200`}
                           alt={item.name} 
                           className="w-16 h-16 border border-slate-100 rounded-[12px] object-cover shadow-sm" 
                        />
                        <span className="absolute -bottom-1.5 -right-1.5 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.25 rounded-full border border-white">
                           x{item.quantity || 1}
                        </span>
                     </div>
                     <div className="flex-1 flex flex-col min-w-0">
                        <h4 className="text-sm text-slate-800 font-extrabold truncate leading-tight mb-1">
                          {item.name || "Sản phẩm Tiger Shop"}
                        </h4>
                        {item.variant_name && (
                          <span className="text-[11px] text-slate-400 font-bold bg-slate-50 self-start px-2 py-0.5 rounded-[4px]">
                            Phân loại: {item.variant_name}
                          </span>
                        )}
                     </div>
                     <div className="flex flex-col items-end gap-3 justify-center self-stretch flex-shrink-0">
                        <span className="text-sm font-bold text-slate-800">₫{formatNumber(item.price)}</span>
                        {status === 'completed' && item.product_id && (
                           <button 
                              onClick={() => {
                                setReviewProductId(item.product_id);
                                setReviewProductName(item.name || "Sản phẩm Tiger Shop");
                                setReviewRating(5);
                                setReviewComment("");
                                setReviewImage(null);
                                setShowReviewModal(true);
                              }} 
                              className="text-[11px] font-extrabold bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20 px-2.5 py-1 rounded-[10px] hover:bg-[#FF7A00] hover:text-white transition-all flex items-center gap-1"
                           >
                             <Star size={10} fill="currentColor" /> Đánh Giá
                           </button>
                        )}
                     </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">Dữ liệu sản phẩm đang được tải hoặc không khả dụng.</div>
              )}
           </div>
        </div>

        {/* BILLING INVOICE & ACTION ZONE */}
        <div className="bg-[#fffbf8] border border-[#ffe4cc] rounded-[16px] p-6 sm:p-8 flex flex-col gap-4 text-sm text-[#222]">
           
           <div className="flex items-center gap-2 text-slate-700 font-black text-sm border-b border-[#ffe6d1] pb-3 mb-1">
             <CreditCard size={18} className="text-[#FF7A00]" />
             <span>Chi Tiết Thanh Toán</span>
           </div>

           <div className="flex justify-between items-center sm:w-96 self-end gap-4 w-full">
              <span className="text-slate-500 font-medium">Phương thức thanh toán</span>
              <span className="font-extrabold text-slate-800">{methodText}</span>
           </div>
           
           <div className="flex justify-between items-center sm:w-96 self-end gap-4 w-full border-b border-dashed border-[#ffe6d1] pb-2">
              <span className="text-slate-500 font-medium">Tổng tiền giao (tiền hàng)</span>
              <span className="font-extrabold text-slate-800">₫{formatNumber(subtotal)}</span>
           </div>
           
           <div className="flex justify-between items-center sm:w-96 self-end gap-4 w-full">
              <span className="text-slate-500 font-medium">Phí vận chuyển</span>
              <span className="font-extrabold text-slate-800">₫{formatNumber(shippingFee)}</span>
           </div>

           {discount > 0 && (
             <div className="flex justify-between items-center sm:w-96 self-end gap-4 w-full bg-[#f0fdf4] border border-[#bbf7d0] px-3 py-1.5 rounded-[8px] text-emerald-700 text-xs">
                <span className="font-bold">Voucher giảm giá (mã {order.voucher_code || 'TIGER_NEW_50'}):</span>
                <span className="font-black">-₫{formatNumber(discount)}</span>
             </div>
           )}
           
           <div className="flex justify-between items-center sm:w-96 self-end gap-4 w-full pt-3 mt-2 border-t border-[#ffe6d1]">
              <span className="text-slate-700 font-black text-base">Tổng toàn bộ đơn hàng</span>
              <span className="text-2xl sm:text-3xl text-[#FF7A00] font-black">₫{formatNumber(order.total)}</span>
           </div>

           {/* BIG DEDICATED REVIEW ACTION BUTTON */}
           {status === 'completed' && itemsArray.some(item => item.product_id) && (
             <div className="border-t border-[#ffe6d1] pt-6 mt-4 w-full flex flex-col items-center">
               <button 
                 onClick={() => {
                   const firstReviewable = itemsArray.find(item => item.product_id);
                   if (firstReviewable) {
                     setReviewProductId(firstReviewable.product_id);
                     setReviewProductName(firstReviewable.name || "Sản phẩm Tiger Shop");
                   }
                   setReviewRating(5);
                   setReviewComment("");
                   setReviewImage(null);
                   setShowReviewModal(true);
                 }}
                 className="w-full sm:w-auto px-10 py-4 bg-[#FF7A00] text-white font-black text-sm rounded-[14px] hover:bg-[#e66d00] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF7A00]/25 transform active:scale-95 duration-200"
               >
                 <Star size={18} fill="white" /> Đánh Giá Sản Phẩm Ngay! 🐯
               </button>
             </div>
           )}

           {/* SYSTEM STATUS ACTIONS */}
           <div className="flex flex-col items-end mt-4 gap-4 w-full">
              {isCustomer && status === "pending" && (
                 <button 
                   onClick={handleCancel} 
                   disabled={cancelling} 
                   className="w-full sm:w-auto px-8 py-3 border border-slate-200 text-slate-500 bg-white font-bold rounded-[12px] hover:bg-slate-50 transition-all text-xs"
                 >
                   {cancelling ? "Đang hủy đơn..." : "Hủy Đơn Hàng"}
                 </button>
              )}
              {isCustomer && status === "shipping" && (
                 <button 
                   onClick={() => handleUpdateStatus("completed", "Đã nhận hàng")} 
                   disabled={confirming} 
                   className="w-full sm:w-auto px-10 py-3.5 bg-[#FF7A00] text-white font-black rounded-[12px] shadow-md hover:bg-[#e66d00] transition-all text-xs"
                 >
                   {confirming ? "Đang xác nhận..." : "Đã Nhận Được Hàng"}
                 </button>
              )}
              {isCustomer && status === "completed" && (
                 <div className="flex gap-3 justify-end w-full flex-wrap sm:flex-nowrap">
                   <button 
                     onClick={() => setShowReturnModal(true)} 
                     className="flex-1 sm:flex-none px-6 py-3 bg-white border border-[#FF7A00] text-[#FF7A00] font-bold rounded-[12px] hover:bg-[#fffbf8] transition-all text-xs"
                   >
                     Yêu cầu Đổi trả / Bảo hành
                   </button>
                   <button 
                     onClick={handleReorder}
                     className="flex-1 sm:flex-none px-8 py-3 bg-[#FF7A00]/10 text-[#FF7A00] font-bold rounded-[12px] hover:bg-[#FF7A00]/20 transition-all text-xs flex items-center justify-center gap-1"
                   >
                     Mua Lại
                   </button>
                 </div>
              )}
              
              {/* STAFF MANAGEMENT ACTIONS */}
              {isStaff && (
                 <div className="w-full sm:w-96 bg-white border border-[#FF7A00]/40 p-5 rounded-[12px] mt-4 flex flex-col gap-3 shadow-md">
                    <span className="text-[11px] font-black text-[#FF7A00] uppercase tracking-wider mb-1 block border-b border-orange-50 pb-2 flex items-center gap-1">
                      <Award size={14} /> Thao Tác Nghiệp Vụ Của Nhân Viên
                    </span>
                    {status === "pending" && (
                      <button onClick={() => handleUpdateStatus("confirmed", "Xác nhận")} disabled={confirming} className="w-full py-2.5 bg-blue-500 text-white font-bold rounded-[10px] text-xs hover:bg-blue-600 transition-colors">XÁC NHẬN ĐƠN</button>
                    )}
                    {status === "confirmed" && (
                      <button onClick={() => handleUpdateStatus("shipping", "Giao hàng")} disabled={confirming} className="w-full py-2.5 bg-orange-500 text-white font-bold rounded-[10px] text-xs hover:bg-orange-600 transition-colors">BẮT ĐẦU GIAO HÀNG</button>
                    )}
                    {status === "shipping" && (
                      <button onClick={() => handleUpdateStatus("completed", "Hoàn tất")} disabled={confirming} className="w-full py-2.5 bg-green-500 text-white font-bold rounded-[10px] text-xs hover:bg-green-600 transition-colors">XÁC NHẬN ĐÃ GIAO XONG</button>
                    )}
                    {status !== "cancelled" && status !== "completed" && (
                      <button onClick={handleCancel} disabled={cancelling} className="w-full py-2.5 bg-slate-500 text-white font-bold rounded-[10px] text-xs hover:bg-slate-600 transition-colors mt-1">HỦY ĐƠN HÀNG (QUẢN TRỊ)</button>
                    )}
                    {order.staff_name && <span className="text-xs text-slate-400 text-center mt-1 font-semibold">Nhân viên xử lý: {order.staff_name}</span>}
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>

    {/* RETURN MODAL */}
    {showReturnModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="bg-white rounded-[16px] p-6 w-full max-w-[450px] shadow-xl border border-slate-50">
          <h3 className="text-lg font-black text-[#FF7A00] mb-3">Yêu Cầu Đổi Trả / Bảo Hành</h3>
          <p className="text-xs text-slate-400 mb-4">Vui lòng mô tả chi tiết lỗi hoặc lý do sếp mong muốn đổi trả để Tiger hỗ trợ nhanh nhất.</p>
          <textarea 
            className="w-full h-28 border border-slate-200 rounded-[12px] p-3 focus:outline-none focus:border-[#FF7A00] mb-4 text-sm resize-none text-slate-800 placeholder-slate-400"
            placeholder="Nhập lý do đổi trả chi tiết..."
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
          ></textarea>
          <div className="flex justify-end gap-2.5 text-xs">
            <button 
              onClick={() => setShowReturnModal(false)}
              className="px-5 py-2.5 border border-slate-200 rounded-[12px] text-slate-500 font-bold hover:bg-slate-50 transition-all"
            >
              Hủy
            </button>
            <button 
              onClick={handleRequestReturn}
              disabled={submittingReturn}
              className="px-6 py-2.5 bg-[#FF7A00] text-white rounded-[12px] font-bold hover:bg-[#e66d00] transition-all"
            >
              {submittingReturn ? "Đang gửi..." : "Gửi Yêu Cầu"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* REVIEW PRODUCT MODAL */}
    {showReviewModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-white rounded-[24px] p-6 w-full max-w-[500px] shadow-2xl border border-slate-50 overflow-hidden" style={{ animation: "scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-[#FF7A00] flex items-center gap-1.5">🐯 Đánh Giá Sản Phẩm</h3>
            <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600 font-bold bg-transparent border-0 text-lg cursor-pointer">✕</button>
          </div>
          
          <p className="text-xs text-slate-700 font-bold mb-4 bg-[#fffbf8] p-3 rounded-[12px] border border-[#ffe4cc]">
            📦 Sản phẩm: <span className="text-[#FF7A00]">{reviewProductName}</span>
          </p>

          <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
            {/* STAR RATING */}
            <div className="flex flex-col items-center gap-2 py-1">
              <span className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Mức độ hài lòng</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= (reviewHoverRating || reviewRating);
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      className="bg-transparent border-0 p-1 cursor-pointer outline-none"
                    >
                      <Star
                        size={32}
                        fill={isActive ? "#FF7A00" : "none"}
                        color="#FF7A00"
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs text-[#FF7A00] font-black mt-0.5">
                {reviewRating === 5 && "⚡ Cực kỳ hài lòng"}
                {reviewRating === 4 && "✨ Rất hài lòng"}
                {reviewRating === 3 && "⭐ Hài lòng"}
                {reviewRating === 2 && "⚠️ Chưa hài lòng"}
                {reviewRating === 1 && "😿 Rất không hài lòng"}
              </span>
            </div>

            {/* COMMENT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Chia sẻ nhận xét của bạn</label>
              <textarea 
                className="w-full h-20 border border-slate-200 rounded-[12px] p-3 text-xs focus:outline-none focus:border-[#FF7A00] transition-colors resize-none text-slate-800 placeholder-slate-400"
                placeholder="Nhận xét thực tế của sếp..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
              ></textarea>
            </div>

            {/* IMAGE UPLOAD */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Thêm hình ảnh thực tế</label>
              <div className="flex items-center gap-3">
                <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-slate-200 rounded-[12px] cursor-pointer hover:border-[#FF7A00] hover:bg-[#fffbf8] transition-all flex-shrink-0">
                  <Camera size={20} className="text-slate-400" />
                  <span className="text-[9px] text-slate-400 mt-1 font-bold">Chọn Ảnh</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => setReviewImage(e.target.files[0])}
                  />
                </label>
                {reviewImage && (
                  <div className="relative w-20 h-20 rounded-[12px] overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
                    <img 
                      src={URL.createObjectURL(reviewImage)} 
                      alt="review preview" 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setReviewImage(null)}
                      className="absolute top-1 right-1 bg-black/60 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold border-0 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SUBMIT BUTTONS */}
            <div className="flex justify-end gap-2.5 mt-2 border-t border-slate-50 pt-4 text-xs">
              <button 
                type="button" 
                onClick={() => setShowReviewModal(false)}
                className="px-5 py-2.5 border border-slate-200 rounded-[12px] text-slate-500 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={submittingReview}
                className="px-7 py-2.5 bg-[#FF7A00] text-white rounded-[12px] font-bold hover:bg-[#e66d00] transition-colors shadow-md cursor-pointer"
              >
                {submittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}

export default OrderDetail;
