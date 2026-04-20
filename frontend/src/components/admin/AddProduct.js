import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Laptop, Shirt, Utensils, Box } from "lucide-react";
import { getCategories, createProduct, getProductById, updateProduct } from "../../services/api";

const AddProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryType, setSelectedCategoryType] = useState("general");
  
  // Basic states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [stock, setStock] = useState("");

  // Specification state (Gathers all dynamic data)
  const [specifications, setSpecifications] = useState({});

  const SIZES = ["S", "M", "L", "XL"];

  const resolveCategoryType = (cat) => {
    if (!cat) return "general";
    let type = cat.display_type || "general";
    const name = (cat.name || "").toLowerCase();
    if (name.includes("điện tử") || name.includes("laptop")) type = "electronics";
    else if (name.includes("thời trang")) type = "fashion";
    else if (name.includes("nội thất")) type = "furniture";
    return type;
  };

  useEffect(() => {
    let loadedCategories = [];
    
    getCategories()
      .then((data) => {
        loadedCategories = Array.isArray(data) ? data : [];
        setCategories(loadedCategories);
        if (!id && loadedCategories.length > 0) {
          const firstCat = loadedCategories[0];
          setSelectedCategoryId(firstCat.id);
          setSelectedCategoryType(resolveCategoryType(firstCat));
        }
      })
      .then(() => {
        if (id) {
          return getProductById(id).then(product => {
            setName(product.name || "");
            setDescription(product.description || "");
            setPrice(product.price || "");
            setOriginalPrice(product.original_price || "");
            setStock(product.stock || "");
            setSelectedCategoryId(product.category_id);
            setSelectedCategoryType(product.display_type || resolveCategoryType(loadedCategories.find(c => c.id === product.category_id)));
            if (product.image) {
              setImageUrl(product.image.startsWith('http') ? product.image : `http://localhost:5000/${product.image}`);
            }
            if (product.specifications) {
              try {
                setSpecifications(typeof product.specifications === 'string' ? JSON.parse(product.specifications) : product.specifications);
              } catch(e) {}
            }
          });
        }
      })
      .catch((err) => console.error("Lỗi:", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  const handleCategoryChange = (e) => {
    const id = e.target.value;
    setSelectedCategoryId(id);
    const cat = categories.find((c) => String(c.id) === String(id));
    if (cat) {
      setSelectedCategoryType(resolveCategoryType(cat));
      // Reset specifications when category changes to avoid mixing data
      setSpecifications({});
    }
  };

  const handleSpecChange = (key, value) => {
    setSpecifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleSpecialListToggle = (listName, item) => {
    let currentList = specifications[listName] || [];
    if (currentList.includes(item)) {
      currentList = currentList.filter(s => s !== item);
    } else {
      currentList = [...currentList, item];
    }
    setSpecifications(prev => ({ ...prev, [listName]: currentList }));
  };

  // Logic tổng hợp dữ liệu cuối cùng để gửi đi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Lấy thông tin user từ localStorage
      const userRole = localStorage.getItem("role") || "";

      // FormData để gửi cả ảnh (nếu sau này thêm upload thực tế)
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category_id", selectedCategoryId);
      formData.append("price", price);
      formData.append("original_price", originalPrice);
      formData.append("stock", stock);
      formData.append("display_type", selectedCategoryType);
      formData.append("specifications", JSON.stringify(specifications));
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imageUrl) {
        formData.append("image", imageUrl);
      }

      // Gọi API thực tế
      if (id) {
        await updateProduct(id, formData);
        alert("🎉 Sản phẩm đã được cập nhật thành công!");
      } else {
        await createProduct(formData);
        alert("🎉 Sản phẩm đã được gửi và trạng thái là Đã Kích Hoạt!");
      }

      const role = userRole.toUpperCase();
      if (role === "MANAGER") {
         navigate("/manager/inventory");
      } else {
         navigate("/admin/dashboard");
      }
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
            {id ? "Sửa sản phẩm 🐯" : "Thêm 1 sản phẩm mới 🐯"}
          </h1>
        </div>

        {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
        <section className="bg-white p-6 rounded-[3px] shadow-sm space-y-6">
          <h2 className="text-[18px] font-medium mb-6">Thông tin cơ bản</h2>

          <div className="grid grid-cols-[150px_1fr] gap-6 items-start">
            <label className="text-right text-gray-600 font-medium mt-2">Ảnh sản phẩm</label>
            <div className="w-full space-y-3">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                <input
                  type="text"
                  className="w-full lg:w-1/2 border border-gray-300 px-3 py-2 rounded-sm focus:border-[#ee4d2d] outline-none"
                  placeholder="Nhập link ảnh (VD: https://...)"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageFile(null);
                  }}
                />
                <span className="text-gray-400 font-medium px-2">HOẶC</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImageUrl("");
                    }
                  }}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-[#feede9] file:text-[#ee4d2d] hover:file:bg-[#fcdbc3] cursor-pointer outline-none"
                />
              </div>
              
              {(imageUrl || imageFile) && (
                <div className="w-32 h-32 border border-gray-200 rounded-sm overflow-hidden flex items-center justify-center bg-gray-50">
                  <img 
                    src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain" 
                    onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Lỗi+Ảnh'} 
                  />
                </div>
              )}
            </div>
          </div>

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

        {/* PHẦN 2: THÔNG TIN KỸ THUẬT */}
        <section className="bg-white p-6 rounded-[3px] shadow-sm space-y-6 border-l-4 border-[#ee4d2d]">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-medium">Thông số kỹ thuật ({selectedCategoryType.toUpperCase()})</h2>
            <div className="text-[#ee4d2d]">
              {selectedCategoryType === 'electronics' && <Laptop size={24} />}
              {selectedCategoryType === 'fashion' && <Shirt size={24} />}
              {selectedCategoryType === 'food' && <Utensils size={24} />}
              {selectedCategoryType === 'general' && <Box size={24} />}
            </div>
          </div>

          {/* DYNAMIC FORMS */}
          {selectedCategoryType === "fashion" && (
            <div className="grid grid-cols-1 gap-6 bg-gray-50 p-6 border rounded-sm">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase block">Size</label>
                <div className="flex gap-4">
                  {SIZES.map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(specifications.sizes || []).includes(s)}
                        onChange={() => handleSpecialListToggle('sizes', s)}
                        className="w-4 h-4 text-[#ee4d2d] focus:ring-[#ee4d2d] border-gray-300 rounded"
                      />
                      <span className="text-gray-700 font-medium">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Màu sắc</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: Đen, Trắng, Đỏ..." 
                  onChange={(e) => handleSpecChange('colors', e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedCategoryType === "electronics" && (
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 border rounded-sm">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">CPU</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: Core i7, M1..." 
                  onChange={(e) => handleSpecChange('cpu', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Dung lượng RAM</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: 8GB, 16GB..." 
                  onChange={(e) => handleSpecChange('ram', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">SSD (Ổ cứng)</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: 256GB SSD, 512GB..." 
                  onChange={(e) => handleSpecChange('ssd', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">VGA (Card đồ họa)</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: RTX 3060, Integrated..." 
                  onChange={(e) => handleSpecChange('vga', e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedCategoryType === "furniture" && (
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 border rounded-sm">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Kích thước</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: 120x60x75 cm..." 
                  onChange={(e) => handleSpecChange('dimensions', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Chất liệu</label>
                <input 
                  className="w-full border p-2 outline-none focus:border-[#ee4d2d]" 
                  placeholder="VD: Gỗ Sồi, Da bò..." 
                  onChange={(e) => handleSpecChange('material', e.target.value)}
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
                  placeholder="VD: Ăn lạnh ngon hơn..." 
                  onChange={(e) => handleSpecChange('processing_notes', e.target.value)}
                />
              </div>
            </div>
          )}

          {(selectedCategoryType === "general" || !["fashion", "electronics", "food", "furniture"].includes(selectedCategoryType)) && (
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
           <button type="button" className="px-6 py-2 bg-white border rounded hover:bg-gray-50 transition-colors" onClick={() => navigate(-1)}>
             Hủy bỏ
           </button>
           <button type="submit" className="px-10 py-2 bg-[#ee4d2d] text-white font-bold rounded shadow-sm hover:bg-[#d73f22] transition-colors">
             {id ? "Lưu thay đổi" : "Lưu & Đăng bán"}
           </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
