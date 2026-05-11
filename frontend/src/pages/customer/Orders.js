import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyOrders, cancelOrderCustomer } from "../../services/api";
import { Package, Truck, CheckCircle2, XCircle, Search, PawPrint } from "lucide-react";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

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
      case "pending": return "CHỜ XÁC NHẬN";
      case "shipping": return "ĐANG GIAO HÀNG";
      case "completed": return "HOÀN THÀNH";
      case "cancelled": return "ĐÃ HỦY";
      default: return status.toUpperCase();
    }
  };
  
  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case "pending": return <Package size={16} className="text-[#FF7A00]" />;
      case "shipping": return <Truck size={16} className="text-[#2673dd]" />;
      case "completed": return <CheckCircle2 size={16} className="text-[#26aa99]" />;
      case "cancelled": return <XCircle size={16} className="text-[#FF7A00]" />;
      default: return null;
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === "all") return true;
    return o.status.toLowerCase() === activeTab;
  });

  const formatNumber = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ thanh toán" },
    { id: "shipping", label: "Vận chuyển" },
    { id: "completed", label: "Hoàn thành" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#f5f5f5] gap-4">
      <div className="animate-spin"><PawPrint size={48} className="text-[#FF7A00]" /></div>
      <span className="text-[#FF7A00] font-bold text-lg">Đang tải đơn hàng...</span>
    </div>
  );

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-20 pt-4">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-0">
        
        {/* TABS */}
        <div className="bg-white flex mb-4 rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] sticky top-0 z-10 overflow-hidden">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-center text-base font-bold transition-colors relative ${
                activeTab === tab.id 
                  ? "text-[#FF7A00]" 
                  : "text-[#222] hover:text-[#FF7A00]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#FF7A00]"></div>
              )}
            </button>
          ))}
        </div>

        {/* SEARCH BAR (Fake functionality for UI) */}
        <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-3 rounded-[12px] mb-4 flex items-center gap-2 border border-gray-100">
           <Search size={20} className="text-gray-400 ml-2" />
           <input 
             type="text" 
             placeholder="Bạn có thể tìm kiếm theo tên Shop, ID đơn hàng hoặc Tên Sản phẩm" 
             className="bg-transparent border-none outline-none text-sm w-full py-1"
           />
        </div>

        {/* ORDER LIST */}
        <div className="flex flex-col gap-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white flex flex-col items-center justify-center py-20 rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
               <div className="text-6xl mb-4">🐯💤</div>
               <span className="text-xl font-bold text-gray-700 mb-2">Tiger tìm mãi không thấy gì!</span>
               <span className="text-gray-500 mb-6">Bạn chưa có đơn hàng nào ở trạng thái này.</span>
               <button onClick={() => navigate("/")} className="px-6 py-2 bg-[#FF7A00] text-white rounded-[12px] font-bold hover:bg-[#e66d00] transition-colors shadow-sm">Khám Phá Hàng Mới</button>
            </div>
          ) : (
            filteredOrders.map((o) => (
              <div key={o.orderId} className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 flex flex-col hover:border-[#FF7A00] border border-transparent transition-colors">
                 <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                       <span className="bg-[#FF7A00] text-white text-[10px] font-bold px-2 py-1 rounded-[4px]">TIGER CHOICE</span>
                       <span className="font-bold text-sm text-[#222]">Tiger Shop Official</span>
                       <button className="flex items-center gap-1 bg-[#fffbf8] border border-[#FF7A00] text-[#FF7A00] px-2 py-1 rounded-[12px] text-xs font-bold hover:bg-[#ffeee0]">
                          <span className="text-[10px]">💬</span> Chat
                       </button>
                       <span className="text-gray-400 text-sm ml-2 font-medium">ID: #{o.orderId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold uppercase">
                       {getStatusIcon(o.status)}
                       <span className={
                          o.status === 'pending' ? 'text-[#FF7A00]' : 
                          o.status === 'shipping' ? 'text-[#2673dd]' : 
                          o.status === 'completed' ? 'text-[#26aa99]' : 
                          'text-[#FF7A00]'
                       }>
                          {getStatusText(o.status)}
                       </span>
                    </div>
                 </div>

                 {/* Order Item Preview */}
                 <div className="flex gap-4 cursor-pointer group" onClick={() => navigate(`/orders/${o.orderId}`)}>
                    <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-[12px] flex items-center justify-center text-3xl group-hover:shadow-sm transition-shadow">
                       📦
                    </div>
                    <div className="flex flex-col flex-1">
                       <span className="text-base text-[#222] font-medium group-hover:text-[#FF7A00] transition-colors">Đơn hàng Tiger Shop #{o.orderId}</span>
                       <span className="text-sm text-gray-500 mt-1">Ngày đặt: {new Date(o.created_at).toLocaleDateString("vi-VN")}</span>
                       <span className="text-xs border border-[#FF7A00] text-[#FF7A00] self-start px-2 py-0.5 mt-2 rounded-[4px] font-medium bg-[#fffbf8]">Trả hàng miễn phí 15 ngày</span>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                       <span className="text-base font-medium text-[#222]">₫{formatNumber(o.total)}</span>
                    </div>
                 </div>
                 
                 <div className="bg-[#fcfcfc] rounded-[12px] p-4 mt-4 flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4">
                    <span className="text-sm text-gray-500 font-medium flex items-center gap-2">
                       <Truck size={16} className="text-[#2673dd]"/>
                       Dự kiến giao: {o.expected_delivery ? new Date(o.expected_delivery).toLocaleDateString("vi-VN") : "Đang cập nhật"}
                    </span>
                    <div className="flex items-center gap-4">
                       <span className="text-sm text-[#222] font-medium">Thành tiền:</span>
                       <span className="text-2xl text-[#FF7A00] font-bold">₫{formatNumber(o.total)}</span>
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 mt-4">
                    {o.status === "completed" && (
                      <button className="px-6 py-2 bg-[#FF7A00] text-white rounded-[12px] text-sm font-bold hover:bg-[#e66d00] transition-colors shadow-sm">Mua Lại</button>
                    )}
                    {o.status === "pending" && (
                      <button 
                        onClick={() => handleCancel(o.orderId)}
                        disabled={cancelling === o.orderId}
                        className="px-6 py-2 bg-white border border-gray-300 text-[#222] rounded-[12px] text-sm font-bold hover:bg-gray-50 transition-colors"
                      >
                        {cancelling === o.orderId ? "Đang hủy..." : "Hủy Đơn"}
                      </button>
                    )}
                    <button 
                      onClick={() => navigate(`/orders/${o.orderId}`)}
                      className="px-6 py-2 bg-white border border-gray-300 text-[#222] rounded-[12px] text-sm font-bold hover:bg-gray-50 transition-colors"
                    >
                      Xem Chi Tiết
                    </button>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;
