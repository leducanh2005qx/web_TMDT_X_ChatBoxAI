import React, { useState, useEffect } from "react";
import { X, Laptop, Shirt, Utensils, Box } from "lucide-react";
import { getCategories, createProduct } from "../../services/api";

const AddProduct = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryType, setSelectedCategoryType] = useState("general");
  
  // Basic states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("");

  // Specification state (Gathers all dynamic data)
  const [specifications, setSpecifications] = useState({});

  // Fashion specific: Variant Table (Size, Color, Qty)
  const [fashionVariants, setFashionVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({ size: "S", color: "", qty: "" });

  const SIZES = ["S", "M", "L", "XL"];

  useEffect(() => {
    // Tải danh mục thực tế từ backend
    getCategories()
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
          setSelectedCategoryType(data[0].display_type || "general");
        }
      })
      .catch((err) => console.error("Lỗi tải danh mục:", err));
  }, []);

  const handleCategoryChange = (e) => {
    const id = e.target.value;
    setSelectedCategoryId(id);
    const cat = categories.find((c) => String(c.id) === String(id));
    if (cat) {
      setSelectedCategoryType(cat.display_type || "general");
      // Reset specifications when category changes to avoid mixing data
      setSpecifications({});
      setFashionVariants([]);
    }
  };

  const handleSpecChange = (key, value) => {
    setSpecifications((prev) => ({ ...prev, [key]: value }));
  };

  const addFashionVariant = () => {
    if (!newVariant.color || !newVariant.qty) return;
    setFashionVariants([...fashionVariants, { ...newVariant }]);
    setNewVariant({ size: "S", color: "", qty: "" });
  };

  const removeFashionVariant = (index) => {
    setFashionVariants(fashionVariants.filter((_, i) => i !== index));
  };

  // Logic tổng hợp dữ liệu cuối cùng để gửi đi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Lấy thông tin user từ localStorage
      const userRole = localStorage.getItem("role") || "";

      // Gộp variant vào specifications nếu là fashion
      const finalSpecs = { ...specifications };
      if (selectedCategoryType === 'fashion') {
        finalSpecs.variants = fashionVariants;
      }

      // FormData để gửi cả ảnh (nếu sau này thêm upload thực tế)
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category_id", selectedCategoryId);
      formData.append("price", price);
      formData.append("original_price", originalPrice);
      formData.append("stock", stock);
      formData.append("display_type", selectedCategoryType);
      formData.append("specifications", JSON.stringify(finalSpecs));

      // Gọi API thực tế
      await createProduct(formData);

      alert("🎉 Sản phẩm đã được gửi! " + (userRole === "Admin" ? "Đã kích hoạt." : "Đang chờ Admin duyệt."));
      window.location.href = "/admin/dashboard";
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] p-6 text-sm text-gray-800">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-4">
        {/* Tiêu đề */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-[20px] font-medium text-gray-800 flex items-center gap-2">
            Thêm 1 sản phẩm mới 🐯
          </h1>
        </div>

        {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
        <section className="bg-white p-6 rounded-[3px] shadow-sm space-y-6">
          <h2 className="text-[18px] font-medium mb-6">Thông tin cơ bản</h2>

          <div className="grid grid-cols-[150px_1fr] gap-6 items-center">
            <label className="text-right text-gray-600 font-medium">Tên sản phẩm</label>
            <input
              type="text"
              className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:border-[#ee4d2d] outline-none"
              placeholder="Nhập tên sản phẩm..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-[150px_1fr] gap-6 items-center">
            <label className="text-right text-gray-600 font-medium">Danh mục</label>
            <select
              className="w-full lg:w-1/2 border border-gray-300 px-3 py-2 rounded-sm focus:border-[#ee4d2d] outline-none bg-white"
              value={selectedCategoryId}
              onChange={handleCategoryChange}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.display_type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-[150px_1fr] gap-6 items-start">
            <label className="mt-2 text-right text-gray-600 font-medium">Mô tả sản phẩm</label>
            <textarea
              className="w-full border border-gray-300 px-3 py-2 rounded-sm focus:border-[#ee4d2d] outline-none min-h-[140px]"
              placeholder="Nhập mô tả sản phẩm của bạn..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
        </section>

        {/* PHẦN 2: THÔNG TIN CHI TIẾT DỰA VÀO DISPLAY_TYPE */}
        <section className="bg-white p-6 rounded-[3px] shadow-sm space-y-6 border-l-4 border-[#ee4d2d]">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-medium">Thông tin chi tiết ({selectedCategoryType.toUpperCase()})</h2>
            <div className="text-[#ee4d2d]">
              {selectedCategoryType === 'electronics' && <Laptop size={24} />}
              {selectedCategoryType === 'fashion' && <Shirt size={24} />}
              {selectedCategoryType === 'food' && <Utensils size={24} />}
              {selectedCategoryType === 'general' && <Box size={24} />}
            </div>
          </div>

          {/* DYNAMIC FORMS */}
          {selectedCategoryType === "fashion" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border rounded-sm flex gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-bold text-gray-500">Size</label>
                  <select 
                    className="w-full border p-2 bg-white outline-none focus:border-[#ee4d2d]"
                    value={newVariant.size}
                    onChange={(e) => setNewVariant({...newVariant, size: e.target.value})}
                  >
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-bold text-gray-500">Màu sắc</label>
                  <input 
                    className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                    placeholder="Đen, Trắng..." 
                    value={newVariant.color}
                    onChange={(e) => setNewVariant({...newVariant, color: e.target.value})}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-bold text-gray-500">Số lượng</label>
                  <input 
                    type="number"
                    className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                    placeholder="0" 
                    value={newVariant.qty}
                    onChange={(e) => setNewVariant({...newVariant, qty: e.target.value})}
                  />
                </div>
                <button 
                  type="button"
                  onClick={addFashionVariant}
                  className="bg-[#ee4d2d] text-white px-4 py-2 rounded-sm hover:bg-[#d73f22] font-medium"
                >
                  Thêm biến thể
                </button>
              </div>

              {/* Bảng biến thể đã thêm */}
              <table className="w-full border border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold text-gray-400">
                    <th className="border p-2 text-left">Size</th>
                    <th className="border p-2 text-left">Màu sắc</th>
                    <th className="border p-2 text-left">Số lượng</th>
                    <th className="border p-2 text-center w-20">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {fashionVariants.map((v, i) => (
                    <tr key={i} className="text-sm">
                      <td className="border p-2">{v.size}</td>
                      <td className="border p-2">{v.color}</td>
                      <td className="border p-2 font-bold text-[#ee4d2d]">{v.qty}</td>
                      <td className="border p-2 text-center">
                        <button onClick={() => removeFashionVariant(i)} className="text-gray-300 hover:text-red-500"><X size={16}/></button>
                      </td>
                    </tr>
                  ))}
                  {fashionVariants.length === 0 && (
                    <tr><td colSpan="4" className="border p-6 text-center text-gray-400 italic">Chưa có biến thể nào được thêm.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selectedCategoryType === "electronics" && (
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 border rounded-sm">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Dung lượng RAM</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: 8GB, 16GB..." 
                  onChange={(e) => handleSpecChange('ram', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Dung lượng ổ cứng</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: 256GB SSD, 512GB..." 
                  onChange={(e) => handleSpecChange('storage', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Chip xử lý (CPU)</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: Core i7, M1..." 
                  onChange={(e) => handleSpecChange('cpu', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Thời gian Bảo hành</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: 12 tháng, 2 năm..." 
                  onChange={(e) => handleSpecChange('warranty', e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedCategoryType === "food" && (
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 border rounded-sm">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Hạn sử dụng</label>
                <input 
                  type="date"
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  onChange={(e) => handleSpecChange('expiry', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Ghi chú chế biến</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: Ăn lạnh ngon hơn, cần lò vi sóng..." 
                  onChange={(e) => handleSpecChange('processing_notes', e.target.value)}
                />
              </div>
            </div>
          )}

          {(selectedCategoryType === "general" || !["fashion", "electronics", "food"].includes(selectedCategoryType)) && (
            <div className="bg-gray-50 p-6 border rounded-sm">
               <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Mô tả ngắn gọn</label>
               <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="Nhập vài dòng giới thiệu nhanh về sản phẩm..."
                  onChange={(e) => handleSpecChange('short_desc', e.target.value)}
               />
            </div>
          )}
        </section>

        {/* PHẦN 3: GIÁ & KHO */}
        <section className="bg-white p-6 rounded-[3px] shadow-sm space-y-6">
          <h2 className="text-[18px] font-medium mb-6">Giá & Kho hàng</h2>
          <div className="grid grid-cols-3 gap-6">
             <div className="space-y-1">
               <label className="text-gray-600">Giá bán (₫)</label>
               <input 
                  type="number" 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
             </div>
             <div className="space-y-1">
               <label className="text-gray-600">Giá gốc (Hủy) (₫)</label>
               <input 
                  type="number" 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="0"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                />
             </div>
             <div className="space-y-1">
               <label className="text-gray-600">Tổng kho hàng</label>
               <input 
                  type="number" 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
             </div>
          </div>
        </section>

        {/* NÚT SUBMIT */}
        <div className="flex justify-end gap-3 pt-6 border-t mt-8">
           <button type="button" className="px-6 py-2 bg-white border rounded hover:bg-gray-50 transition-colors">
             Hủy bỏ
           </button>
           <button type="submit" className="px-10 py-2 bg-[#ee4d2d] text-white font-bold rounded shadow-sm hover:bg-[#d73f22] transition-colors">
             Lưu & Đăng bán
           </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
