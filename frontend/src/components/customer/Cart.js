import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState([]);

  const toggleSelect = (cartKey) => {
    setSelectedKeys((prev) =>
      prev.includes(cartKey)
        ? prev.filter((k) => k !== cartKey)
        : [...prev, cartKey],
    );
  };

  const toggleSelectAll = () => {
    setSelectedKeys(
      selectedKeys.length === cart.length ? [] : cart.map((i) => i.cartKey),
    );
  };

  const selectedItems = cart.filter((item) =>
    selectedKeys.includes(item.cartKey),
  );
  
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Optimistic UI updates
  const updateQuantity = (cartKey, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const remove = (cartKey) => {
    setCart(prev => prev.filter(item => item.cartKey !== cartKey));
    setSelectedKeys(prev => prev.filter(k => k !== cartKey));
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0)
      return alert("Vui lòng chọn sản phẩm để thanh toán!");
    navigate("/checkout", { state: { checkoutItems: selectedItems } });
  };

  if (cart.length === 0)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-[2rem] shadow-sm border border-gray-100">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl mb-6"
        >
          🛒
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Giỏ hàng đang trống</h2>
        <p className="text-gray-400 mb-8 max-w-xs">Hãy khám phá bộ sưu tập mới nhất của Tiger Shop và chọn cho mình những siêu phẩm nhé!</p>
        <button onClick={() => navigate("/shop")} className="tiger-btn px-8 py-4">
          QUAY LẠI CỬA HÀNG <ArrowRight size={20} />
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="text-[#FF8C00]" size={32} />
            GIỎ HÀNG
          </h1>
          <p className="text-gray-400 font-medium">Bạn có {cart.length} sản phẩm trong giỏ</p>
        </div>
        <button 
          onClick={toggleSelectAll}
          className="text-sm font-bold text-[#FF8C00] hover:underline flex items-center gap-2"
        >
          {selectedKeys.length === cart.length ? "Bỏ chọn tất cả" : "Chọn tất cả sản phẩm"}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ITEMS LIST */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                layout
                key={item.cartKey}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className={`tiger-card p-4 flex gap-4 items-center group transition-all ${selectedKeys.includes(item.cartKey) ? "border-[#FF8C00] bg-orange-50/30" : ""}`}
              >
                {/* SELECTOR */}
                <div 
                  onClick={() => toggleSelect(item.cartKey)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${selectedKeys.includes(item.cartKey) ? "bg-[#FF8C00] border-transparent" : "border-gray-200 group-hover:border-[#FF8C00]"}`}
                >
                  {selectedKeys.includes(item.cartKey) && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>

                {/* IMAGE */}
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <img
                    src={item.image?.startsWith('http') ? item.image : `http://localhost:5000/${item.image}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* DETAILS */}
                <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-[#333] line-clamp-1">{item.name}</h4>
                    {item.variant_name && <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.variant_name}</span>}
                    <p className="text-[#FF8C00] font-black">{item.price.toLocaleString()}đ</p>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-6">
                    <div className="flex items-center bg-gray-100 rounded-xl p-1">
                      <button 
                        onClick={() => updateQuantity(item.cartKey, -1)}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500"
                      >
                        <Minus size={14} />
                      </button>
                      <motion.span 
                        key={item.quantity}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="w-8 text-center text-sm font-black"
                      >
                        {item.quantity}
                      </motion.span>
                      <button 
                        onClick={() => updateQuantity(item.cartKey, 1)}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => remove(item.cartKey)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* SUMMARY */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-6">
            <h3 className="text-xl font-bold border-b pb-4">TỔNG ĐƠN HÀNG</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Tạm tính ({selectedItems.length} SP)</span>
                <span className="font-bold">{totalAmount.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Phí vận chuyển</span>
                <span className="text-green-500 font-bold">Miễn phí</span>
              </div>
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-gray-800 font-bold">Tổng cộng</span>
                <div className="text-right">
                  <motion.p 
                    key={totalAmount}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl font-black text-[#FF8C00]"
                  >
                    {totalAmount.toLocaleString()}đ
                  </motion.p>
                  <p className="text-[10px] text-gray-400 font-medium">Đã bao gồm VAT nếu có</p>
                </div>
              </div>
            </div>
            <button 
              className="tiger-btn w-full py-4 text-lg shadow-tiger"
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
            >
              THANH TOÁN NGAY <ArrowRight size={20} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Cart;
