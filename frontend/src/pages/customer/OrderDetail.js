import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrderById, cancelOrderCustomer, updateOrderStatus, requestReturnWarranty } from "../../services/api";
import { ChevronLeft, MapPin, PawPrint } from "lucide-react";

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#f5f5f5] gap-4">
      <div className="animate-spin"><PawPrint size={48} className="text-[#FF7A00]" /></div>
      <span className="text-[#FF7A00] font-bold text-lg">Đang tải chi tiết đơn...</span>
    </div>
  );

  if (!order) return null;

  const isCustomer = userRole === "CUSTOMER" || userRole === "";
  const isStaff = ["STAFF", "MANAGER", "ADMIN"].includes(userRole);
  const status = order.status?.toLowerCase() || 'pending';
  
  const getStatusText = (s) => {
    switch(s) {
      case "pending": return "CHỜ XÁC NHẬN";
      case "confirmed": return "ĐÃ XÁC NHẬN";
      case "shipping": return "ĐANG GIAO HÀNG";
      case "completed": return "HOÀN THÀNH";
      case "cancelled": return "ĐÃ HỦY";
      default: return s?.toUpperCase();
    }
  };

  const method = String(order.payment_method || "cod").toLowerCase().trim();
  const isQR = method === "qr" || method === "banking qr";
  const methodText = isQR ? "Chuyển khoản VietQR" : "Thanh toán khi nhận hàng (COD)";

  const formatNumber = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  // Define steps for timeline (Tiger style)
  const steps = [
    { key: 'pending', label: 'Đã Đặt', emoji: '🐾' },
    { key: 'confirmed', label: 'Đã Xác Nhận', emoji: '🐅' },
    { key: 'shipping', label: 'Đang Giao', emoji: '🛵' },
    { key: 'completed', label: 'Đã Giao', emoji: '🐯' }
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

  return (
    <>
    <div className="bg-[#f5f5f5] min-h-screen pb-20 pt-4">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-0 flex flex-col gap-6">
        
        {/* HEADER */}
        <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col lg:flex-row items-center justify-between p-6">
           <button onClick={() => navigate("/orders")} className="flex items-center text-sm font-bold text-gray-500 hover:text-[#FF7A00] uppercase transition-colors">
              <ChevronLeft size={20}/> TRỞ LẠI
           </button>
           <div className="flex items-center gap-4 mt-4 lg:mt-0 text-sm">
              <span className="text-[#222] font-bold">MÃ ĐƠN HÀNG. {order.orderId || order.id}</span>
              <span className="text-gray-300">|</span>
              <span className="text-[#FF7A00] font-bold uppercase">{getStatusText(status)}</span>
           </div>
        </div>

        {/* TIMELINE (Not shown for cancelled) */}
        {status !== 'cancelled' && (
          <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-10 pb-12 flex justify-between relative overflow-hidden">
             <div className="absolute top-[64px] left-[10%] right-[10%] h-2 bg-[#f0f0f0] rounded-full z-0"></div>
             {activeStep >= 0 && (
               <div 
                 className="absolute top-[64px] left-[10%] h-2 bg-[#FF7A00] rounded-full z-1 transition-all duration-700 ease-in-out" 
                 style={{ width: `${(activeStep / (steps.length - 1)) * 80}%` }}
               ></div>
             )}
             
             {steps.map((step, idx) => {
               const isActive = idx <= activeStep;
               return (
                 <div key={idx} className="flex flex-col items-center gap-4 z-10 w-1/4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center border-[4px] text-4xl shadow-sm transition-colors duration-500 ${isActive ? 'bg-white border-[#FF7A00]' : 'bg-gray-50 border-[#e0e0e0] grayscale'}`}>
                       {step.emoji}
                    </div>
                    <span className={`text-base font-bold ${isActive ? 'text-[#FF7A00]' : 'text-gray-400'}`}>{step.label}</span>
                 </div>
               );
             })}
          </div>
        )}

        {/* CANCELED WARNING */}
        {status === 'cancelled' && (
          <div className="bg-[#fffbf8] p-8 rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#ffd8b8] flex flex-col items-center justify-center text-center">
             <div className="text-5xl mb-4">😿</div>
             <h3 className="text-2xl text-[#FF7A00] font-bold mb-2">Đơn hàng đã hủy</h3>
             <p className="text-base text-gray-600">Rất tiếc vì trải nghiệm mua sắm này chưa được trọn vẹn. Hãy ủng hộ Tiger Shop ở các đơn sau nhé!</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ADDRESS INFO */}
          <div className="col-span-1 lg:col-span-3 bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8 relative pt-[4px] overflow-hidden">
             {/* Decorative striped border */}
             <div className="absolute top-0 left-0 w-full h-[4px]" style={{ background: 'repeating-linear-gradient(45deg,#6fa6d6,#6fa6d6 33px,transparent 0,transparent 41px,#FF7A00 0,#FF7A00 74px,transparent 0,transparent 82px)' }}></div>
             <div className="flex items-center justify-between mb-6 mt-2">
                <div className="flex items-center gap-2 text-xl text-[#FF7A00] font-bold">
                  <MapPin size={24} />
                  <span>Địa Chỉ Nhận Hàng</span>
                </div>
             </div>
             
             <div className="flex flex-col gap-2 text-base text-[#222]">
                <span className="font-bold text-lg mb-1">{order.receiver_name || "Khách Hàng"}</span>
                <span className="text-gray-500 font-medium">{order.receiver_phone || "Không có SĐT"}</span>
                <span className="text-gray-500">{order.shipping_address}</span>
             </div>
          </div>

          {/* PRODUCTS LIST */}
          <div className="col-span-1 lg:col-span-3 bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#fafafa]">
                <div className="flex items-center gap-3">
                   <span className="bg-[#FF7A00] text-white text-[10px] font-bold px-2 py-1 rounded-[4px]">TIGER CHOICE</span>
                   <span className="font-bold text-base text-[#222]">Tiger Shop Official</span>
                   <button className="flex items-center gap-1 bg-white border border-[#FF7A00] text-[#FF7A00] px-3 py-1 rounded-[12px] text-xs font-bold ml-2 hover:bg-[#fffbf8] transition-colors shadow-sm">
                      <span className="text-[12px]">💬</span> Chat
                   </button>
                </div>
             </div>

             <div className="flex flex-col p-6 gap-6">
                {order?.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                       <img 
                          src={item?.image?.startsWith('http') ? item.image : (item?.image ? `http://localhost:5000/${item.image}` : "https://placehold.co/400x400?text=No+Image")} 
                          alt={item.name} 
                          className="w-24 h-24 border border-gray-100 rounded-[12px] object-cover shadow-sm" 
                       />
                       <div className="flex flex-col flex-1 gap-1">
                          <span className="text-lg text-[#222] font-medium leading-tight">{item.name || "Sản phẩm Tiger Shop"}</span>
                          {item.variant_name && <span className="text-sm text-gray-500 font-medium">Phân loại: {item.variant_name}</span>}
                          <span className="text-sm text-gray-500 font-bold">x{item.quantity || 1}</span>
                       </div>
                       <div className="flex flex-col items-end gap-3 justify-center">
                          <span className="text-lg text-[#FF7A00] font-bold">₫{formatNumber(item.price)}</span>
                          {status === 'completed' && (
                             <button onClick={() => navigate(`/product/${item.product_id}`)} className="text-sm font-bold bg-[#FF7A00] text-white px-4 py-2 rounded-[12px] shadow-sm hover:bg-[#e66d00] transition-colors">Đánh Giá</button>
                          )}
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-gray-500">Dữ liệu sản phẩm không còn khả dụng.</div>
                )}
             </div>
          </div>

          {/* TOTAL & PAYMENT INFO */}
          <div className="col-span-1 lg:col-span-3 bg-[#fffbf8] border border-[#ffd8b8] rounded-[12px] p-8 flex flex-col gap-4 text-base text-[#222]">
             <div className="flex justify-between items-center lg:w-96 self-end border-b border-[#ffe6d1] pb-3">
                <span className="text-gray-500 font-medium">Phương thức thanh toán</span>
                <span className="font-bold">{methodText}</span>
             </div>
             <div className="flex justify-between items-center lg:w-96 self-end">
                <span className="text-gray-500 font-medium">Tổng tiền hàng</span>
                <span className="font-bold">₫{formatNumber(order.subtotal || order.total || 0)}</span>
             </div>
             <div className="flex justify-between items-center lg:w-96 self-end">
                <span className="text-gray-500 font-medium">Phí vận chuyển</span>
                <span className="font-bold">₫{formatNumber(order.shipping_fee || 0)}</span>
             </div>
             {order?.discount > 0 && (
               <div className="flex justify-between items-center lg:w-96 self-end">
                  <span className="text-gray-500 font-medium">Voucher Shopee ({order.voucher_code})</span>
                  <span className="font-bold">-₫{formatNumber(order.discount)}</span>
               </div>
             )}
             <div className="flex justify-between items-center lg:w-96 self-end pt-3 mt-2 border-t border-[#ffe6d1]">
                <span className="text-gray-500 font-bold text-lg">Thành tiền</span>
                <span className="text-4xl text-[#FF7A00] font-bold">₫{formatNumber(order.total)}</span>
             </div>

             {/* ACTIONS ZONE */}
             <div className="flex flex-col items-end mt-6 gap-4">
                {isCustomer && status === "pending" && (
                   <button onClick={handleCancel} disabled={cancelling} className="px-10 py-3 border-2 border-gray-300 text-gray-600 bg-white font-bold rounded-[12px] hover:bg-gray-50 transition-colors shadow-sm">
                     {cancelling ? "ĐANG HỦY..." : "Hủy Đơn Hàng"}
                   </button>
                )}
                {isCustomer && status === "shipping" && (
                   <button onClick={() => handleUpdateStatus("completed", "Đã nhận hàng")} disabled={confirming} className="px-10 py-3 bg-[#FF7A00] text-white font-bold rounded-[12px] shadow-sm hover:bg-[#e66d00] transition-colors">
                     {confirming ? "ĐANG XỬ LÝ..." : "Đã Nhận Được Hàng"}
                   </button>
                )}
                {isCustomer && status === "completed" && (
                   <div className="flex flex-col sm:flex-row gap-4 justify-end">
                     <button onClick={() => setShowReturnModal(true)} className="px-6 py-3 bg-white border border-[#FF7A00] text-[#FF7A00] font-bold rounded-[12px] shadow-sm hover:bg-[#fffbf8] transition-colors">
                       Yêu cầu Đổi trả/Bảo hành
                     </button>
                     <button onClick={() => navigate("/")} className="px-10 py-3 bg-[#FF7A00] text-white font-bold rounded-[12px] shadow-sm hover:bg-[#e66d00] transition-colors">
                       Mua Lại
                     </button>
                   </div>
                )}
                
                {/* STAFF CONTROLS */}
                {isStaff && (
                   <div className="w-full lg:w-96 bg-white border-2 border-[#FF7A00] p-6 rounded-[12px] mt-6 flex flex-col gap-3 shadow-lg">
                      <span className="text-sm font-black text-[#FF7A00] uppercase mb-2 block border-b border-orange-100 pb-2">Vùng Thao Tác Quản Trị</span>
                      {status === "pending" && (
                        <button onClick={() => handleUpdateStatus("confirmed", "Xác nhận")} disabled={confirming} className="w-full py-3 bg-blue-500 text-white font-bold rounded-[12px] hover:bg-blue-600 transition-colors">XÁC NHẬN ĐƠN</button>
                      )}
                      {status === "confirmed" && (
                        <button onClick={() => handleUpdateStatus("shipping", "Giao hàng")} disabled={confirming} className="w-full py-3 bg-orange-500 text-white font-bold rounded-[12px] hover:bg-orange-600 transition-colors">GIAO HÀNG</button>
                      )}
                      {status === "shipping" && (
                        <button onClick={() => handleUpdateStatus("completed", "Hoàn tất")} disabled={confirming} className="w-full py-3 bg-green-500 text-white font-bold rounded-[12px] hover:bg-green-600 transition-colors">HOÀN TẤT ĐƠN</button>
                      )}
                      {status !== "cancelled" && status !== "completed" && (
                        <button onClick={handleCancel} disabled={cancelling} className="w-full py-3 bg-gray-500 text-white font-bold rounded-[12px] hover:bg-gray-600 transition-colors mt-2">HỦY ĐƠN (QUẢN TRỊ)</button>
                      )}
                      {order.staff_name && <span className="text-sm text-gray-500 text-center mt-2 font-medium">NV xử lý: {order.staff_name}</span>}
                   </div>
                )}
             </div>
          </div>
        </div>

      </div>
    </div>

      {/* RETURN MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[12px] p-6 w-full max-w-[500px] shadow-xl">
            <h3 className="text-xl font-bold text-[#FF7A00] mb-4">Yêu Cầu Đổi Trả / Bảo Hành</h3>
            <p className="text-sm text-gray-600 mb-4">Vui lòng cung cấp lý do chi tiết để Tiger Shop hỗ trợ bạn nhanh nhất.</p>
            <textarea 
              className="w-full h-32 border border-gray-300 rounded-[12px] p-3 focus:outline-none focus:border-[#FF7A00] mb-4 text-sm"
              placeholder="Nhập lý do đổi trả hoặc mô tả lỗi sản phẩm..."
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowReturnModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-[12px] text-gray-600 font-bold hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleRequestReturn}
                disabled={submittingReturn}
                className="px-6 py-2 bg-[#FF7A00] text-white rounded-[12px] font-bold hover:bg-[#e66d00]"
              >
                {submittingReturn ? "Đang gửi..." : "Gửi Yêu Cầu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrderDetail;
