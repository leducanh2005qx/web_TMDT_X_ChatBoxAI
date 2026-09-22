import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Laptop, Shirt, Utensils, Box, Layers, Trash2, Plus, Sparkles, Check } from "lucide-react";
import { getCategories, createProduct, getProductById, updateProduct, createCategory, deleteCategory } from "../../services/api";

const AddProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryType, setSelectedCategoryType] = useState("general");
  
  // Modal Quick Add Category
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("general");
  const [addCatLoading, setAddCatLoading] = useState(false);
  const [addCatError, setAddCatError] = useState("");

  // Variants state (Phân loại hàng & Kích cỡ)
  const [hasVariants, setHasVariants] = useState(false);
  const [variantsList, setVariantsList] = useState([]);
  const [customVariantName, setCustomVariantName] = useState("");
  const [batchPrice, setBatchPrice] = useState("");
  const [batchStock, setBatchStock] = useState("");

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
            if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
              setHasVariants(true);
              setVariantsList(
                product.variants.map((v) => ({
                  id: v.id,
                  variant_name: v.variant_name,
                  price: v.price !== null && v.price !== undefined ? v.price : product.price,
                  stock: v.stock || 0,
                  sku: v.sku || "",
                }))
              );
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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setAddCatLoading(true);
    setAddCatError("");
    try {
      const created = await createCategory({
        name: newCatName.trim(),
        display_type: newCatType || "general",
      });
      const createdCat = {
        id: created.id,
        name: created.name || newCatName.trim(),
        display_type: created.display_type || newCatType || "general",
      };
      setCategories((prev) => [...prev, createdCat]);
      setSelectedCategoryId(createdCat.id);
      setSelectedCategoryType(resolveCategoryType(createdCat));
      setSpecifications({});
      setShowAddCatModal(false);
      setNewCatName("");
      setNewCatType("general");
    } catch (err) {
      setAddCatError(err.message || "Lỗi tạo danh mục");
    } finally {
      setAddCatLoading(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const confirmMsg = Number(cat.product_count) > 0
      ? `Danh mục "${cat.name}" đang liên kết với ${cat.product_count} sản phẩm.\nNếu xóa, các sản phẩm này sẽ được chuyển thành "Chưa phân loại".\n\nBạn có chắc chắn muốn xóa danh mục này?`
      : `Bạn có chắc chắn muốn xóa danh mục "${cat.name}" không?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      if (String(selectedCategoryId) === String(cat.id)) {
        const remaining = categories.filter((c) => c.id !== cat.id);
        if (remaining.length > 0) {
          setSelectedCategoryId(remaining[0].id);
          setSelectedCategoryType(resolveCategoryType(remaining[0]));
        } else {
          setSelectedCategoryId("");
          setSelectedCategoryType("general");
        }
      }
    } catch (err) {
      alert("Lỗi khi xóa danh mục: " + (err.message || "Không thể xóa"));
    }
  };

  // Helper lấy thông tin danh mục cho preset phân loại
  const getCategoryInfo = () => {
    const cat = categories.find((c) => String(c.id) === String(selectedCategoryId));
    const catName = (cat?.name || "").toLowerCase();
    const isFashion = catName.includes("thời trang") || catName.includes("áo") || catName.includes("quần") || selectedCategoryType === "fashion";
    const isShoes = catName.includes("giày") || catName.includes("dép") || catName.includes("shoes");
    const isElectronics = catName.includes("điện tử") || catName.includes("máy ảnh") || catName.includes("điện thoại") || catName.includes("tai nghe") || selectedCategoryType === "electronics";
    return { isFashion, isShoes, isElectronics, catName };
  };

  const addVariantItem = (varName, vPrice = "", vStock = 10) => {
    const trimmed = String(varName).trim();
    if (!trimmed) return;
    setVariantsList((prev) => {
      if (prev.some((item) => item.variant_name.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return [
        ...prev,
        {
          variant_name: trimmed,
          price: vPrice || price || "",
          stock: vStock,
          sku: "",
        },
      ];
    });
  };

  const addPresetGroup = (group) => {
    group.forEach((item) => addVariantItem(item));
  };

  const removeVariantItem = (index) => {
    setVariantsList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariantItem = (index, field, value) => {
    setVariantsList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const applyBatchValues = () => {
    if (!batchPrice && !batchStock) return;
    setVariantsList((prev) =>
      prev.map((item) => ({
        ...item,
        price: batchPrice ? Number(batchPrice) : item.price,
        stock: batchStock !== "" ? Number(batchStock) : item.stock,
      }))
    );
  };

  const totalVariantStock = variantsList.reduce(
    (sum, v) => sum + (Number(v.stock) || 0),
    0
  );

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
      formData.append("original_price", originalPrice);
      formData.append("display_type", selectedCategoryType);
      formData.append("specifications", JSON.stringify(specifications));

      // Xử lý phân loại hàng (Biến thể & Size)
      if (hasVariants) {
        if (variantsList.length === 0) {
          alert("⚠️ Vui lòng thêm ít nhất một kích cỡ/phân loại hoặc tắt tính năng phân loại hàng!");
          return;
        }
        const hasEmptyName = variantsList.some((v) => !v.variant_name || !String(v.variant_name).trim());
        if (hasEmptyName) {
          alert("⚠️ Vui lòng nhập đầy đủ tên cho tất cả các dòng phân loại!");
          return;
        }
        formData.append("variants", JSON.stringify(variantsList));
        formData.append("stock", totalVariantStock);
        // Nếu giá chính rỗng, lấy giá của phân loại đầu tiên
        const mainPrice = price || variantsList[0].price || 0;
        formData.append("price", mainPrice);
      } else {
        formData.append("variants", JSON.stringify([]));
        formData.append("price", price);
        formData.append("stock", stock);
      }

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
        alert("🎉 Sản phẩm đã được tạo và kích hoạt thành công!");
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
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full lg:w-3/4">
              <select
                className="w-full sm:w-2/3 border border-gray-300 px-3 py-2 rounded-sm focus:border-[#ee4d2d] outline-none bg-white"
                value={selectedCategoryId}
                onChange={handleCategoryChange}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.display_type || "general"})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setShowAddCatModal(true);
                  setAddCatError("");
                  setNewCatName("");
                  setNewCatType("general");
                }}
                className="whitespace-nowrap px-3 py-2 bg-orange-50 hover:bg-orange-100 text-[#ee4d2d] border border-orange-200 rounded-sm font-semibold text-xs flex items-center gap-1 transition-all"
              >
                ⚙️ Quản lý danh mục
              </button>
            </div>
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

        {/* PHẦN: PHÂN LOẠI HÀNG (BIẾN THỂ & SIZE) */}
        <section className="bg-white p-6 rounded-[3px] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-[18px] font-medium text-gray-800 flex items-center gap-2">
                <Layers size={20} className="text-[#ee4d2d]" />
                Phân loại hàng (Biến thể & Size)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Bật tùy chọn này nếu sản phẩm có nhiều kích cỡ, màu sắc hoặc nhiều phiên bản giá khác nhau.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ee4d2d]"></div>
              <span className="ml-3 text-xs font-bold text-gray-700">
                {hasVariants ? "Bật phân loại" : "Tắt phân loại"}
              </span>
            </label>
          </div>

          {hasVariants && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Nút bấm chọn nhanh mẫu (Presets) theo danh mục */}
              <div className="p-4 bg-orange-50/70 border border-orange-200/70 rounded-md space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#ee4d2d]">
                  <Sparkles size={16} /> Chọn nhanh mẫu phân loại theo danh mục:
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {getCategoryInfo().isFashion && (
                    <>
                      <button
                        type="button"
                        onClick={() => addPresetGroup(["S", "M", "L", "XL", "2XL"])}
                        className="px-3 py-1.5 bg-[#ee4d2d] hover:bg-[#d73f22] text-white font-bold text-xs rounded shadow-sm transition-all flex items-center gap-1"
                      >
                        ⚡ Tạo nhanh [S, M, L, XL, 2XL]
                      </button>
                      {["S", "M", "L", "XL", "2XL", "FreeSize"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addVariantItem(s)}
                          className="px-3 py-1 bg-white border border-orange-200 hover:border-[#ee4d2d] text-gray-700 hover:text-[#ee4d2d] text-xs rounded font-medium transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                    </>
                  )}

                  {getCategoryInfo().isShoes && (
                    <>
                      <button
                        type="button"
                        onClick={() => addPresetGroup(["38", "39", "40", "41", "42", "43"])}
                        className="px-3 py-1.5 bg-[#ee4d2d] hover:bg-[#d73f22] text-white font-bold text-xs rounded shadow-sm transition-all flex items-center gap-1"
                      >
                        ⚡ Tạo nhanh [38, 39, 40, 41, 42, 43]
                      </button>
                      {["36", "37", "38", "39", "40", "41", "42", "43", "44"].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => addVariantItem(`Size ${sz}`)}
                          className="px-3 py-1 bg-white border border-orange-200 hover:border-[#ee4d2d] text-gray-700 hover:text-[#ee4d2d] text-xs rounded font-medium transition-colors"
                        >
                          + Size {sz}
                        </button>
                      ))}
                    </>
                  )}

                  {getCategoryInfo().isElectronics && (
                    <>
                      <button
                        type="button"
                        onClick={() => addPresetGroup(["Bản tiêu chuẩn", "Bản Pro"])}
                        className="px-3 py-1.5 bg-[#ee4d2d] hover:bg-[#d73f22] text-white font-bold text-xs rounded shadow-sm transition-all flex items-center gap-1"
                      >
                        ⚡ Tạo nhanh [Bản tiêu chuẩn, Bản Pro]
                      </button>
                      {["Bản tiêu chuẩn", "Bản Pro", "Bản Cao cấp", "64GB", "128GB", "256GB"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => addVariantItem(opt)}
                          className="px-3 py-1 bg-white border border-orange-200 hover:border-[#ee4d2d] text-gray-700 hover:text-[#ee4d2d] text-xs rounded font-medium transition-colors"
                        >
                          + {opt}
                        </button>
                      ))}
                    </>
                  )}

                  {!getCategoryInfo().isFashion && !getCategoryInfo().isShoes && !getCategoryInfo().isElectronics && (
                    <>
                      <button
                        type="button"
                        onClick={() => addPresetGroup(["Bản tiêu chuẩn", "Bản nâng cấp"])}
                        className="px-3 py-1.5 bg-[#ee4d2d] hover:bg-[#d73f22] text-white font-bold text-xs rounded shadow-sm transition-all flex items-center gap-1"
                      >
                        ⚡ Tạo nhanh mẫu cơ bản
                      </button>
                      {["Nhỏ", "Vừa", "Lớn", "1m2", "1m4", "1m6", "250g", "500g"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addVariantItem(tag)}
                          className="px-3 py-1 bg-white border border-orange-200 hover:border-[#ee4d2d] text-gray-700 hover:text-[#ee4d2d] text-xs rounded font-medium transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Thêm/xóa size thủ công */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Tự gõ size/phân loại khác (VD: Size 29, 1m6 x 80cm, Màu Xanh...)"
                  value={customVariantName}
                  onChange={(e) => setCustomVariantName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (customVariantName.trim()) {
                        addVariantItem(customVariantName.trim());
                        setCustomVariantName("");
                      }
                    }
                  }}
                  className="flex-1 border border-gray-300 px-3 py-2 rounded-sm focus:border-[#ee4d2d] outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customVariantName.trim()) {
                      addVariantItem(customVariantName.trim());
                      setCustomVariantName("");
                    }
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-black text-white text-xs font-bold rounded-sm transition-colors flex items-center gap-1 shrink-0"
                >
                  <Plus size={16} /> Thêm phân loại
                </button>
              </div>

              {/* Áp dụng nhanh cho tất cả size */}
              {variantsList.length > 1 && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-sm text-xs">
                  <span className="font-bold text-gray-700">Áp dụng giá & kho cho tất cả:</span>
                  <input
                    type="number"
                    placeholder="Giá bán chung (₫)"
                    value={batchPrice}
                    onChange={(e) => setBatchPrice(e.target.value)}
                    className="w-36 border border-gray-300 px-2 py-1.5 rounded-sm outline-none focus:border-[#ee4d2d] bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Kho hàng chung"
                    value={batchStock}
                    onChange={(e) => setBatchStock(e.target.value)}
                    className="w-28 border border-gray-300 px-2 py-1.5 rounded-sm outline-none focus:border-[#ee4d2d] bg-white"
                  />
                  <button
                    type="button"
                    onClick={applyBatchValues}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-sm transition-colors"
                  >
                    Áp dụng tất cả
                  </button>
                </div>
              )}

              {/* Bảng chi tiết biến thể */}
              {variantsList.length > 0 ? (
                <div className="border border-gray-200 rounded-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-gray-600">
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3 min-w-[160px]">Tên size / phân loại <span className="text-red-500">*</span></th>
                        <th className="p-3 w-44">Giá bán (₫) <span className="text-red-500">*</span></th>
                        <th className="p-3 w-36">Kho hàng <span className="text-red-500">*</span></th>
                        <th className="p-3 w-40">Mã SKU (Tùy chọn)</th>
                        <th className="p-3 w-16 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {variantsList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                          <td className="p-3 text-center font-bold text-gray-400">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={item.variant_name}
                              onChange={(e) => updateVariantItem(idx, "variant_name", e.target.value)}
                              placeholder="VD: Size L"
                              className="w-full border border-gray-300 px-2.5 py-1.5 rounded-sm focus:border-[#ee4d2d] outline-none font-medium"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              required
                              value={item.price}
                              onChange={(e) => updateVariantItem(idx, "price", e.target.value)}
                              placeholder="0"
                              className="w-full border border-gray-300 px-2.5 py-1.5 rounded-sm focus:border-[#ee4d2d] outline-none font-semibold text-gray-800"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              required
                              value={item.stock}
                              onChange={(e) => updateVariantItem(idx, "stock", e.target.value)}
                              placeholder="0"
                              className="w-full border border-gray-300 px-2.5 py-1.5 rounded-sm focus:border-[#ee4d2d] outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.sku}
                              onChange={(e) => updateVariantItem(idx, "sku", e.target.value)}
                              placeholder="SKU-..."
                              className="w-full border border-gray-300 px-2.5 py-1.5 rounded-sm focus:border-[#ee4d2d] outline-none text-gray-600"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeVariantItem(idx)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Xóa phân loại này"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-semibold text-gray-700 border-t border-gray-200">
                        <td colSpan={3} className="p-3">
                          Tổng số phân loại: <span className="text-[#ee4d2d] font-bold">{variantsList.length}</span> loại
                        </td>
                        <td colSpan={3} className="p-3 text-right pr-6">
                          Tổng tồn kho phân loại: <span className="text-[#ee4d2d] font-bold">{totalVariantStock}</span> sản phẩm
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-sm bg-gray-50/50">
                  <p className="text-gray-500 text-xs font-medium mb-1">Chưa có kích cỡ / phân loại nào được thêm.</p>
                  <p className="text-gray-400 text-[11px]">Bấm các nút chọn nhanh mẫu ở trên hoặc tự gõ tên size để thêm vào bảng.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* PHẦN 3: GIÁ & KHO */}
        <section className="bg-white p-6 rounded-[3px] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-medium">Giá & Kho hàng</h2>
            {hasVariants && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <Check size={14} /> Tự động đồng bộ kho từ {variantsList.length} phân loại
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-gray-600 font-medium">
                Giá bán hiển thị (₫) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="w-full border p-2 outline-none focus:border-[#ee4d2d] rounded-sm"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required={!hasVariants}
              />
              {hasVariants && (
                <p className="text-[11px] text-gray-400">
                  Giá mặc định đại diện. Khách sẽ mua theo giá từng phân loại hàng chọn bên trên.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-gray-600 font-medium">Giá gốc / Niêm yết (₫)</label>
              <input
                type="number"
                className="w-full border p-2 outline-none focus:border-[#ee4d2d] rounded-sm"
                placeholder="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
              <p className="text-[11px] text-gray-400">Hiển thị gạch ngang giảm giá nếu cao hơn giá bán.</p>
            </div>

            <div className="space-y-1">
              <label className="text-gray-600 font-medium">
                Tổng kho hàng <span className="text-red-500">*</span>
              </label>
              {hasVariants ? (
                <div className="relative">
                  <input
                    type="number"
                    className="w-full border p-2 outline-none bg-gray-100 text-gray-700 font-bold rounded-sm cursor-not-allowed"
                    value={totalVariantStock}
                    readOnly
                  />
                  <span className="text-[11px] text-green-600 font-semibold block mt-1">
                    ✔ Tự động tính từ các phân loại: {totalVariantStock} sản phẩm
                  </span>
                </div>
              ) : (
                <>
                  <input
                    type="number"
                    className="w-full border p-2 outline-none focus:border-[#ee4d2d] rounded-sm"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-gray-400">Tổng số lượng có sẵn trong kho.</p>
                </>
              )}
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

      {/* ── MODAL QUẢN LÝ DANH MỤC (THÊM / XÓA) ── */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <span>📁</span> Quản lý danh mục sản phẩm
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* KHỐI 1: THÊM DANH MỤC MỚI */}
              <form onSubmit={handleCreateCategory} className="p-4 bg-orange-50/50 border border-orange-100 rounded-lg space-y-3">
                <h4 className="text-xs font-bold text-[#ee4d2d] uppercase flex items-center gap-1.5">
                  <Plus size={16} /> Thêm danh mục mới
                </h4>

                {addCatError && (
                  <div className="p-2.5 bg-red-50 text-red-600 rounded text-xs border border-red-200">
                    {addCatError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 uppercase">
                      Tên danh mục <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Đồ chơi, Phụ kiện..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 outline-none focus:border-[#ee4d2d] text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600 uppercase">
                      Loại giao diện (Type)
                    </label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 outline-none focus:border-[#ee4d2d] text-xs bg-white"
                    >
                      <option value="general">Mặc định (Tổng hợp)</option>
                      <option value="fashion">Thời trang (Size, Màu)</option>
                      <option value="electronics">Điện tử (Cấu hình)</option>
                      <option value="furniture">Nội thất (Chất liệu)</option>
                      <option value="food">Đồ ăn (Hạn dùng)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={addCatLoading || !newCatName.trim()}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#ee4d2d] hover:bg-[#d73f22] rounded shadow-sm disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    {addCatLoading ? "Đang lưu..." : "+ Thêm & Chọn danh mục"}
                  </button>
                </div>
              </form>

              {/* KHỐI 2: DANH SÁCH & XÓA DANH MỤC */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">
                    Danh sách danh mục hiện có ({categories.length})
                  </h4>
                  <span className="text-[11px] text-gray-400">Bấm nút thùng rác để xóa danh mục</span>
                </div>

                {categories.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto">
                    {categories.map((c) => (
                      <div key={c.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-[#ee4d2d] font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{c.id}
                          </span>
                          <div>
                            <span className="font-bold text-gray-800 text-sm block leading-tight">
                              {c.name}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Loại: <span className="text-gray-700 font-medium">{c.display_type || "general"}</span>
                              {c.product_count !== undefined && (
                                <> &bull; <span className="text-orange-600 font-semibold">{c.product_count} sản phẩm</span></>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {String(selectedCategoryId) === String(c.id) && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold rounded-full">
                              Đang chọn
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c)}
                            className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded transition-all"
                            title={`Xóa danh mục "${c.name}"`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-xs text-gray-400">Chưa có danh mục nào trong hệ thống.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 flex justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => setShowAddCatModal(false)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;
