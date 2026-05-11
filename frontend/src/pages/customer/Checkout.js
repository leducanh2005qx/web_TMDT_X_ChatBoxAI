import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createOrder, getMyVouchers } from "../../services/api";
import { MapPin, Ticket } from "lucide-react";
// Import CSS if needed, but we will use Tailwind mainly
// import "./Checkout.css"; 

function Checkout({ cart, setCart }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Thông tin ngân hàng MB
  const MY_BANK = {
    BANK_ID: "MB",
    ACCOUNT_NO: "3616042005888",
    ACCOUNT_NAME: "LE DINH DUC ANH",
  };

  const checkoutItems = useMemo(() => {
    const items = location.state?.checkoutItems || cart || [];
    return Array.isArray(items) ? items : [];
  }, [location.state, cart]);

  const [address, setAddress] = useState("");
  const [vouchers, setVouchers] = useState([]);
  const [selectedVouchers, setSelectedVouchers] = useState({ item: null, shipping: null });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [city, setCity] = useState("Hà Nội");

  const subtotal = useMemo(() => {
    return checkoutItems.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0), 0);
  }, [checkoutItems]);

  const originalShippingFee = useMemo(() => {
    if (!city || subtotal === 0) return 0;
    let baseFee = 0;
    if (subtotal <= 1000000) {
      const rates = { "Hà Nội": 20000, "TP Hồ Chí Minh": 35000, "Khác": 45000 };
      baseFee = rates[city] || rates["Khác"];
    }
    if (shippingMethod === "express") {
      baseFee += 50000;
    }
    return baseFee;
  }, [city, subtotal, shippingMethod]);

  const { itemDiscount, shippingDiscount } = useMemo(() => {
    let iDiscount = 0, sDiscount = 0;
    if (selectedVouchers.item) {
      const v = selectedVouchers.item;
      iDiscount = v.type === "percent"
          ? Math.min(Math.floor((subtotal * Number(v.value || 0)) / 100), Number(v.max_discount || Infinity))
          : Number(v.value || 0);
    }
    if (selectedVouchers.shipping) {
      sDiscount = Math.min(originalShippingFee, Number(selectedVouchers.shipping.value || 0));
    }
    return { itemDiscount: iDiscount, shippingDiscount: sDiscount };
  }, [selectedVouchers, subtotal, originalShippingFee]);

  const finalShippingFee = Math.max(originalShippingFee - shippingDiscount, 0);
  const finalSubtotal = Math.max(subtotal - itemDiscount, 0);
  const finalTotal = finalSubtotal + finalShippingFee;

  const qrCodeUrl = `https://img.vietqr.io/image/${MY_BANK.BANK_ID}-${MY_BANK.ACCOUNT_NO}-compact2.png?amount=${finalTotal}&addInfo=TigerShop%20ThanhToan&accountName=${MY_BANK.ACCOUNT_NAME}`;

  useEffect(() => {
    getMyVouchers().then((data) => setVouchers(Array.isArray(data) ? data : []));
  }, []);

  const handleApplyVoucher = (id) => {
    if (!id) return;
    const v = vouchers.find((x) => x.voucher_id === Number(id));
    if (v?.type === "free_ship") setSelectedVouchers((p) => ({ ...p, shipping: v }));
    else setSelectedVouchers((p) => ({ ...p, item: v }));
  };

  const removeVoucher = (type) => setSelectedVouchers((p) => ({ ...p, [type]: null }));

  const handleCheckout = async () => {
    if (checkoutItems.length === 0) return alert("Không có sản phẩm để thanh toán");
    if (!address.trim() || !city) return alert("Vui lòng nhập địa chỉ và chọn Tỉnh/Thành phố");

    const appliedVoucherIds = [selectedVouchers.item?.voucher_id, selectedVouchers.shipping?.voucher_id].filter(Boolean);

    try {
      await createOrder({
        items: checkoutItems,
        total: finalTotal,
        shipping_address: `${address.trim()}, ${city}`,
        voucher_ids: appliedVoucherIds,
        payment_method: paymentMethod,
      });
      alert("🎉 Đặt hàng thành công!");
      const purchasedKeys = checkoutItems.map((item) => item.cartKey);
      setCart((prevCart) => prevCart.filter((item) => !purchasedKeys.includes(item.cartKey)));
      navigate("/orders");
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const formatNumber = (p) => new Intl.NumberFormat("vi-VN").format(p || 0);

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-20 pt-4">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-0 flex flex-col gap-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 bg-white p-6 rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
           <h1 className="text-2xl text-[#FF7A00] font-bold border-r border-gray-300 pr-4">Tiger Shop</h1>
           <span className="text-xl text-[#222] font-bold">Thanh Toán</span>
        </div>

        {/* ADDRESS SECTION */}
        <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] relative pt-[3px] overflow-hidden">
          {/* Decorative striped border */}
          <div className="absolute top-0 left-0 w-full h-[3px]" style={{
             background: 'repeating-linear-gradient(45deg,#6fa6d6,#6fa6d6 33px,transparent 0,transparent 41px,#FF7A00 0,#FF7A00 74px,transparent 0,transparent 82px)'
          }}></div>
          
          <div className="p-6 lg:p-7">
            <div className="flex items-center gap-2 text-[#FF7A00] text-lg mb-4">
              <MapPin size={20} />
              <h2 className="font-bold">Địa Chỉ Nhận Hàng</h2>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
               <div className="flex gap-4">
                 <span className="font-bold text-[#222]">Đức Anh (+84) 987654321</span>
               </div>
               <div className="flex flex-1 flex-col lg:flex-row gap-4 items-start lg:items-center">
                  <input 
                    type="text" 
                    placeholder="Số nhà, tên đường, phường/xã..." 
                    className="flex-1 border border-gray-300 rounded-[12px] px-3 py-2 focus:outline-none focus:border-[#FF7A00] text-sm"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <select 
                    className="border border-gray-300 rounded-[12px] px-3 py-2 focus:outline-none focus:border-[#FF7A00] text-sm"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP Hồ Chí Minh">TP Hồ Chí Minh</option>
                    <option value="Khác">Tỉnh thành khác</option>
                  </select>
               </div>
               <button className="text-blue-600 text-sm uppercase font-bold hover:underline">Thiết lập</button>
            </div>
          </div>
        </div>

        {/* PRODUCTS SECTION */}
        <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
           <div className="p-6">
              {/* Table Header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 text-gray-500 text-sm font-bold mb-4">
                 <div className="col-span-6">Sản phẩm</div>
                 <div className="col-span-2 text-center">Đơn giá</div>
                 <div className="col-span-2 text-center">Số lượng</div>
                 <div className="col-span-2 text-right">Thành tiền</div>
              </div>

              {/* Items */}
              {checkoutItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center py-4 border-t border-dashed border-gray-200">
                   <div className="col-span-6 flex gap-4">
                      <img src={item.image?.startsWith('http') ? item.image : `http://localhost:5000/${item.image}`} alt={item.name} className="w-12 h-12 rounded-[12px] object-cover border border-gray-100" />
                      <div className="flex flex-col justify-center">
                         <span className="text-sm text-[#222] font-medium line-clamp-1">{item.name}</span>
                         {item.variant_name && <span className="text-xs text-gray-500 mt-1">Loại: {item.variant_name}</span>}
                      </div>
                   </div>
                   <div className="col-span-2 lg:text-center text-sm text-gray-800 font-medium">
                      ₫{formatNumber(item.price)}
                   </div>
                   <div className="col-span-2 lg:text-center text-sm text-gray-800 font-medium">
                      {item.quantity}
                   </div>
                   <div className="col-span-2 lg:text-right text-sm text-[#FF7A00] font-bold">
                      ₫{formatNumber(item.price * item.quantity)}
                   </div>
                </div>
              ))}
           </div>
           
           <div className="bg-[#fffbf8] border-t border-dashed border-gray-200 p-6 flex items-center justify-end">
              <span className="text-sm text-gray-500 mr-4 font-medium">Tổng số tiền ({checkoutItems.length} sản phẩm):</span>
              <span className="text-xl font-bold text-[#FF7A00]">₫{formatNumber(subtotal)}</span>
           </div>
        </div>

        {/* VOUCHER & COIN */}
        <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#222] text-sm font-bold">
                 <Ticket size={20} className="text-[#FF7A00]"/>
                 <span>Tiger Voucher</span>
              </div>
              <div className="flex items-center gap-4">
                 {selectedVouchers.item && (
                   <span className="bg-[#FF7A00] text-white text-xs px-2 py-1 rounded-[12px] cursor-pointer font-bold" onClick={() => removeVoucher('item')}>
                     {selectedVouchers.item.code} ✖
                   </span>
                 )}
                 {selectedVouchers.shipping && (
                   <span className="bg-[#00bfa5] text-white text-xs px-2 py-1 rounded-[12px] cursor-pointer font-bold" onClick={() => removeVoucher('shipping')}>
                     {selectedVouchers.shipping.code} ✖
                   </span>
                 )}
                 
                 <select 
                   className="text-blue-600 font-bold text-sm focus:outline-none bg-transparent cursor-pointer"
                   onChange={(e) => handleApplyVoucher(e.target.value)}
                   value=""
                 >
                   <option value="">Chọn Voucher</option>
                   {vouchers.map(v => (
                     <option key={v.voucher_id} value={v.voucher_id} disabled={subtotal < Number(v.min_order_value || 0)}>
                       {v.code} - {v.type === 'free_ship' ? "Freeship" : "Giảm giá"}
                     </option>
                   ))}
                 </select>
              </div>
           </div>
        </div>

        {/* SHIPPING METHOD */}
        <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden mb-6">
           <div className="p-6 flex flex-col lg:flex-row gap-6 border-b border-gray-100">
              <div className="text-sm text-[#222] font-bold w-40">Phương thức vận chuyển</div>
              <div className="flex flex-wrap gap-3">
                 <button 
                   onClick={() => setShippingMethod('standard')}
                   className={`px-4 py-2 border rounded-[12px] text-sm font-medium transition-colors relative overflow-hidden ${shippingMethod === 'standard' ? 'border-[#FF7A00] text-[#FF7A00] bg-[#fffbf8]' : 'border-gray-300 text-[#222]'}`}
                 >
                   Giao hàng tiêu chuẩn
                   {shippingMethod === 'standard' && (
                     <div className="absolute bottom-0 right-0 w-0 h-0 border-t-[14px] border-t-transparent border-r-[14px] border-r-[#FF7A00] rounded-br-[10px]">
                        <Check size={10} className="absolute top-[-10px] right-[-13px] text-white" />
                     </div>
                   )}
                 </button>
                 <button 
                   onClick={() => setShippingMethod('express')}
                   className={`px-4 py-2 border rounded-[12px] text-sm font-medium transition-colors relative overflow-hidden flex flex-col items-start ${shippingMethod === 'express' ? 'border-[#FF7A00] text-[#FF7A00] bg-[#fffbf8]' : 'border-gray-300 text-[#222]'}`}
                 >
                   <span>Giao hàng Hỏa tốc 🚀</span>
                   <span className="text-xs font-normal opacity-80">(+50.000đ)</span>
                   {shippingMethod === 'express' && (
                     <div className="absolute bottom-0 right-0 w-0 h-0 border-t-[14px] border-t-transparent border-r-[14px] border-r-[#FF7A00] rounded-br-[10px]">
                        <Check size={10} className="absolute top-[-10px] right-[-13px] text-white" />
                     </div>
                   )}
                 </button>
              </div>
           </div>
        </div>

        {/* PAYMENT METHOD */}
        <div className="bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
           <div className="p-6 flex flex-col lg:flex-row gap-6 border-b border-gray-100">
              <div className="text-sm text-[#222] font-bold w-40">Phương thức thanh toán</div>
              <div className="flex flex-wrap gap-3">
                 <button 
                   onClick={() => setPaymentMethod('cod')}
                   className={`px-4 py-2 border rounded-[12px] text-sm font-medium transition-colors relative overflow-hidden ${paymentMethod === 'cod' ? 'border-[#FF7A00] text-[#FF7A00] bg-[#fffbf8]' : 'border-gray-300 text-[#222]'}`}
                 >
                   Thanh toán khi nhận hàng
                   {paymentMethod === 'cod' && (
                     <div className="absolute bottom-0 right-0 w-0 h-0 border-t-[14px] border-t-transparent border-r-[14px] border-r-[#FF7A00] rounded-br-[10px]">
                        <Check size={10} className="absolute top-[-10px] right-[-13px] text-white" />
                     </div>
                   )}
                 </button>
                 <button 
                   onClick={() => setPaymentMethod('qr')}
                   className={`px-4 py-2 border rounded-[12px] text-sm font-medium transition-colors relative overflow-hidden ${paymentMethod === 'qr' ? 'border-[#FF7A00] text-[#FF7A00] bg-[#fffbf8]' : 'border-gray-300 text-[#222]'}`}
                 >
                   Chuyển khoản QR
                   {paymentMethod === 'qr' && (
                     <div className="absolute bottom-0 right-0 w-0 h-0 border-t-[14px] border-t-transparent border-r-[14px] border-r-[#FF7A00] rounded-br-[10px]">
                        <Check size={10} className="absolute top-[-10px] right-[-13px] text-white" />
                     </div>
                   )}
                 </button>
              </div>
           </div>

           {/* QR DISPLAY IF SELECTED */}
           {paymentMethod === 'qr' && (
             <div className="p-6 bg-[#f5f5f5] flex items-center justify-center border-b border-gray-100">
                <div className="flex flex-col items-center gap-2">
                   <div className="w-48 h-48 bg-white border border-gray-200 p-2 rounded-[12px] shadow-sm">
                      <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain rounded-[8px]" />
                   </div>
                   <p className="text-sm text-[#FF7A00] font-bold mt-2">Mở App Ngân hàng quét mã để thanh toán</p>
                </div>
             </div>
           )}

           {/* TOTAL SUMMARY */}
           <div className="bg-[#fffefb] p-6 lg:p-8 flex flex-col items-end gap-3 text-sm text-[#222]">
              <div className="flex justify-between w-full lg:w-80">
                 <span className="text-gray-500 font-medium">Tổng tiền hàng</span>
                 <span className="font-bold">₫{formatNumber(subtotal)}</span>
              </div>
              <div className="flex justify-between w-full lg:w-80">
                 <span className="text-gray-500 font-medium">Phí vận chuyển</span>
                 <span className="font-bold">₫{formatNumber(originalShippingFee)}</span>
              </div>
              {shippingDiscount > 0 && (
                <div className="flex justify-between w-full lg:w-80">
                   <span className="text-gray-500 font-medium">Giảm phí vận chuyển</span>
                   <span className="font-bold">-₫{formatNumber(shippingDiscount)}</span>
                </div>
              )}
              {itemDiscount > 0 && (
                <div className="flex justify-between w-full lg:w-80">
                   <span className="text-gray-500 font-medium">Voucher giảm giá</span>
                   <span className="font-bold">-₫{formatNumber(itemDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between w-full lg:w-80 items-center mt-2">
                 <span className="text-gray-500 font-bold text-base">Tổng thanh toán</span>
                 <span className="text-3xl text-[#FF7A00] font-bold">₫{formatNumber(finalTotal)}</span>
              </div>
           </div>

           <div className="border-t border-gray-100 p-6 lg:px-8 lg:py-6 flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500 text-center lg:text-left">
                 Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo <span className="text-blue-600 cursor-pointer font-bold">Điều khoản Tiger Shop</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={checkoutItems.length === 0}
                className="w-full lg:w-64 h-12 bg-[#FF7A00] text-white text-base font-bold rounded-[12px] shadow-sm hover:bg-[#e66d00] transition-colors"
              >
                Đặt hàng
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}

// Thêm component Check nội bộ
const Check = ({size, className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default Checkout;
