import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrders, cancelOrderCustomer } from "../../services/api";
import { Package, Truck, CheckCircle2, XCircle, Search, PawPrint, Star, RefreshCw, ChevronRight } from "lucide-react";

function Orders({ cart = [], setCart }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  const handleReorder = (orderItems) => {
    if (!orderItems || orderItems.length === 0) {
      alert("⚠️ Đơn hàng này không có sản phẩm nào hợp lệ để mua lại!");
      return;
    }
    const newCart = [...cart];
    orderItems.forEach(item => {
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

  const loadOrders = () => {
    setLoading(true);
    getMyOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => console.error("Không lấy được đơn hàng"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm(`Bạn có chắc muốn hủy đơn #${orderId}? Hành động này không thể hoàn tác.`)) return;
    setCancelling(orderId);
    try {
      await cancelOrderCustomer(orderId);
      alert("✅ Đã hủy đơn hàng thành công!");
      loadOrders();
    } catch (err) {
      alert("Lỗi: " + (err.message || "Không thể hủy đơn hàng"));
    } finally {
      setCancelling(null);
    }
  };

  const getStatusText = (status) => {
    switch(status.toLowerCase()) {
      case "pending": return "Chờ xác nhận";
      case "confirmed": return "Đã xác nhận";
      case "shipping": return "Đang giao hàng";
      case "completed": return "Hoàn thành";
      case "cancelled": return "Đã hủy";
      default: return status.toUpperCase();
    }
  };
  
  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case "pending": return <Package size={14} className="text-[#FF7A00]" />;
      case "confirmed": return <CheckCircle2 size={14} className="text-amber-500" />;
      case "shipping": return <Truck size={14} className="text-[#3b82f6]" />;
      case "completed": return <CheckCircle2 size={14} className="text-[#10b981]" />;
      case "cancelled": return <XCircle size={14} className="text-gray-400" />;
      default: return null;
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch(status.toLowerCase()) {
      case "pending": return "text-[#FF7A00] bg-[#fff7f0] border border-[#ffe4cc]";
      case "confirmed": return "text-amber-600 bg-amber-50 border border-amber-200";
      case "shipping": return "text-[#3b82f6] bg-[#eff6ff] border border-[#dbeafe]";
      case "completed": return "text-[#10b981] bg-[#f0fdf4] border border-[#bbf7d0]";
      default: return "text-gray-500 bg-gray-50 border border-gray-200";
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ["pending", "confirmed"].includes(o.status.toLowerCase());
    return o.status.toLowerCase() === activeTab;
  });

  const formatNumber = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ xác nhận" },
    { id: "shipping", label: "Đang giao" },
    { id: "completed", label: "Hoàn thành" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#f8fafc] gap-4">
      <div className="animate-spin text-[#FF7A00]"><PawPrint size={48} fill="#FF7A00" /></div>
      <span className="text-[#FF7A00] font-extrabold text-lg tracking-wide">TIGER SHOP ĐANG TẢI...</span>
    </div>
  );

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24 pt-6">
      <div className="max-w-[850px] mx-auto px-4">
        
        {/* TITLED HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-extrabold text-[#222] tracking-tight flex items-center gap-2">
            <span className="text-3xl">🐯</span> Đơn Hàng Của Tôi
          </h1>
          <span className="text-sm text-gray-500 font-medium">Tổng số: {orders.length} đơn</span>
        </div>

        {/* TIKTOK STYLE TABS */}
        <div className="bg-white flex mb-6 rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden sticky top-2 z-20">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const count = tab.id === "all" ? orders.length : 
                          tab.id === "pending" ? orders.filter(o => ["pending", "confirmed"].includes(o.status.toLowerCase())).length :
                          orders.filter(o => o.status.toLowerCase() === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 text-center text-sm font-bold transition-all relative ${
                  isActive 
                    ? "text-[#FF7A00]" 
                    : "text-slate-600 hover:text-[#FF7A00]"
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-[#FF7A00]/10 text-[#FF7A00]" : "bg-slate-100 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  )}
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-1/4 w-1/2 h-[3px] bg-[#FF7A00] rounded-t-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* SEARCH BAR (Fake search experience) */}
        <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-3.5 rounded-[16px] mb-6 flex items-center gap-3 border border-slate-100">
           <Search size={18} className="text-slate-400 ml-2" />
           <input 
             type="text" 
             placeholder="Tìm kiếm theo mã đơn, sản phẩm hoặc shop..." 
             className="bg-transparent border-none outline-none text-sm w-full py-1 text-slate-800 placeholder-slate-400"
           />
        </div>

        {/* ORDER LIST */}
        <div className="flex flex-col gap-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-white flex flex-col items-center justify-center py-20 rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100">
               <div className="text-6xl mb-4 animate-bounce">🐯</div>
               <h3 className="text-xl font-black text-slate-800 mb-2">Chưa có đơn hàng nào!</h3>
               <p className="text-slate-400 text-sm max-w-sm text-center mb-6 leading-relaxed">
                 Danh sách trống trơn sếp ơi. Hãy ghé qua cửa hàng và lấp đầy giỏ hàng cùng Tiger nhé!
               </p>
               <button 
                 onClick={() => navigate("/")} 
                 className="px-8 py-3 bg-[#FF7A00] text-white rounded-[14px] font-bold hover:bg-[#e66d00] transition-colors shadow-lg shadow-[#FF7A00]/20 text-sm"
               >
                 Mua Sắm Ngay
               </button>
            </div>
          ) : (
            filteredOrders.map((o) => {
              const orderItems = Array.isArray(o.items) ? o.items : [];
              const totalItemsCount = orderItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
              
              return (
                <div 
                  key={o.orderId} 
                  onClick={() => navigate(`/orders/${o.orderId}`)}
                  className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100 p-5 flex flex-col hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:border-[#FF7A00]/30 transition-all duration-300 cursor-pointer"
                >
                   {/* CARD HEADER */}
                   <div className="flex justify-between items-center border-b border-slate-50 pb-4 mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                         <span className="bg-red-500 text-white text-[10px] font-black tracking-wide px-2 py-0.5 rounded-[4px]">TIGER SHOP OFFICIAL</span>
                         <span className="text-slate-700 font-extrabold text-sm bg-slate-50 px-2 py-0.5 rounded-[6px]">#{o.orderId}</span>
                         <button 
                           onClick={(e) => { e.stopPropagation(); }}
                           className="flex items-center gap-1 bg-[#fffbf8] border border-[#FF7A00]/30 text-[#FF7A00] px-2.5 py-0.5 rounded-[12px] text-[11px] font-bold hover:bg-[#ffeee0] transition-all ml-1"
                         >
                            <span>💬</span> Liên hệ
                         </button>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1 rounded-full ${getStatusBadgeStyle(o.status)}`}>
                         {getStatusIcon(o.status)}
                         <span>{getStatusText(o.status)}</span>
                      </div>
                   </div>

                   {/* TIKTOK STYLE PRODUCTS LIST */}
                   <div className="flex flex-col gap-4 mb-5">
                     {orderItems.length > 0 ? (
                       orderItems.map((item, index) => (
                         <div key={index} className="flex gap-4 items-start py-1">
                           <div className="relative">
                             <img 
                               src={
                                 item.image
                                   ? (item.image.startsWith('http') 
                                       ? item.image 
                                       : `http://localhost:5000/${item.image.replace(/^\/+/, '')}`)
                                   : `https://picsum.photos/id/${(item.product_id * 17) % 1000}/120/120`
                               } 
                               alt={item.name} 
                               className="w-16 h-16 rounded-[12px] object-cover border border-slate-100 shadow-sm flex-shrink-0"
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
                               <span className="text-[11px] text-slate-400 font-medium bg-slate-50 self-start px-2 py-0.5 rounded-[4px]">
                                 Phân loại: {item.variant_name}
                               </span>
                             )}
                           </div>
                           <div className="text-right flex-shrink-0">
                             <span className="text-sm font-bold text-slate-800">₫{formatNumber(item.price)}</span>
                           </div>
                         </div>
                       ))
                     ) : (
                       // Fallback display if items array is empty/lazy loaded
                       <div className="flex gap-4 items-center">
                         <img 
                           src={`https://picsum.photos/id/${(o.orderId * 17) % 1000}/120/120`}
                           className="w-16 h-16 rounded-[12px] object-cover border border-slate-100 shadow-sm flex-shrink-0"
                           alt="Tiger Shop"
                         />
                         <div className="flex-1">
                           <h4 className="text-sm text-slate-800 font-extrabold">
                             Đơn hàng Tiger Shop #{o.orderId}
                           </h4>
                           <span className="text-xs text-slate-400 font-medium">Ngày đặt: {new Date(o.created_at).toLocaleDateString("vi-VN")}</span>
                         </div>
                         <div className="text-right">
                           <span className="text-sm font-bold text-[#FF7A00]">₫{formatNumber(o.total)}</span>
                         </div>
                       </div>
                     )}
                   </div>
                   
                   {/* CARD BOTTOM SUMMARY */}
                   <div className="bg-[#fafbfc] rounded-[12px] p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border border-slate-50 mb-4">
                      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                         <Truck size={14} className="text-[#3b82f6]"/>
                         {o.status.toLowerCase() === "shipping" 
                           ? "🚚 Hàng đang trên đường giao tới sếp" 
                           : o.status.toLowerCase() === "completed" 
                             ? "🎉 Giao hàng hoàn tất thành công!" 
                             : "⏰ Đang chờ chuẩn bị hàng"
                         }
                      </span>
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                         <span className="text-xs text-slate-500 font-medium">
                           Tổng ({totalItemsCount || 1} sản phẩm):
                         </span>
                         <span className="text-lg text-[#FF7A00] font-black">₫{formatNumber(o.total)}</span>
                      </div>
                   </div>

                   {/* DYNAMIC ACTION BUTTONS */}
                   <div className="flex justify-end gap-2.5">
                      {/* View details button always accessible for all orders */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.orderId}`); }}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-[12px] text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1"
                      >
                         Xem Chi Tiết <ChevronRight size={14} />
                      </button>

                      {/* Shipping or Pending order actions */}
                      {(o.status.toLowerCase() === "shipping" || o.status.toLowerCase() === "pending") && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.orderId}`); }}
                          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-[12px] text-xs font-bold hover:bg-slate-50 transition-all"
                        >
                          Đổi Trả Hàng
                        </button>
                      )}

                      {/* Completed order actions */}
                      {o.status.toLowerCase() === "completed" && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.orderId}`); }}
                            className="px-5 py-2.5 bg-[#FF7A00] text-white rounded-[12px] text-xs font-bold hover:bg-[#e66d00] transition-all flex items-center gap-1 shadow-md shadow-[#FF7A00]/10"
                          >
                            <Star size={14} fill="white" /> Đánh Giá
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleReorder(o.items); }}
                            className="px-5 py-2.5 bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20 rounded-[12px] text-xs font-bold hover:bg-[#FF7A00] hover:text-white transition-all flex items-center gap-1"
                          >
                            <RefreshCw size={12} /> Mua Lại
                          </button>
                        </>
                      )}

                      {/* Cancelled order actions */}
                      {o.status.toLowerCase() === "cancelled" && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleReorder(o.items); }}
                          className="px-5 py-2.5 bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/20 rounded-[12px] text-xs font-bold hover:bg-[#FF7A00] hover:text-white transition-all flex items-center gap-1"
                        >
                          <RefreshCw size={12} /> Mua Lại Sản Phẩm
                        </button>
                      )}

                      {/* Cancel Order capability if Pending */}
                      {o.status.toLowerCase() === "pending" && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCancel(o.orderId); }}
                          disabled={cancelling === o.orderId}
                          className="px-5 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-[12px] text-xs font-bold transition-all border border-red-100"
                        >
                          {cancelling === o.orderId ? "Đang hủy..." : "Hủy Đơn"}
                        </button>
                      )}
                   </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;
