import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { getProducts, getCategories } from "../../services/api";
import SmartProductCard from "../../components/customer/SmartProductCard";

function Shop({ keyword, addToCart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // States cho Bộ lọc
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [appliedPriceRange, setAppliedPriceRange] = useState({ min: "", max: "" });
  const [sortOrder, setSortOrder] = useState("");
  const [loading, setLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.category) {
      setSelectedCategories([location.state.category]);
    }
  }, [location.state]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getProducts(), getCategories()]).then(([pData, cData]) => {
      setProducts(Array.isArray(pData) ? pData : []);
      setCategories(Array.isArray(cData) ? cData : []);
      setLoading(false);
    });
  }, []);

  const handleApplyPrice = () => {
    setAppliedPriceRange({ min: priceMin, max: priceMax });
  };

  const toggleCategory = (catName) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catName));
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Lọc Danh mục
    if (selectedCategories.length > 0) {
      list = list.filter(p => selectedCategories.includes(p.category) || selectedCategories.includes(p.category_name));
    }

    // Lọc Keyword
    const k = (keyword || "").toLowerCase();
    if (k) list = list.filter(p => p.name.toLowerCase().includes(k));

    // Lọc Khoảng giá
    const min = Number(appliedPriceRange.min);
    const max = Number(appliedPriceRange.max);
    if (!isNaN(min) && min > 0) {
      list = list.filter(p => Number(p.price) >= min);
    }
    if (!isNaN(max) && max > 0) {
      list = list.filter(p => Number(p.price) <= max);
    }

    // Sắp xếp
    if (sortOrder === "priceAsc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortOrder === "priceDesc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortOrder === "newest") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortOrder === "bestSelling") list.sort((a, b) => Number(b.sold_count) - Number(a.sold_count));

    return list;
  }, [products, selectedCategories, keyword, appliedPriceRange, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex items-start gap-8">
      {/* 2. Cột trái (Left Sidebar - Chiếm 25% chiều rộng) */}
      <div className="w-1/4 flex-shrink-0 sticky top-24">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-8">
          
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800 mb-6 border-b border-gray-100 pb-3">
              Bộ lọc tìm kiếm
            </h3>
            
            <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
              Danh mục
            </h4>
            <div className="space-y-2">
              {categories.map(c => (
                <label key={c.id} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectedCategories.includes(c.name)}
                    onChange={() => toggleCategory(c.name)}
                    className="w-4 h-4 rounded border-gray-300 text-[#FF8C00] focus:ring-[#FF8C00] cursor-pointer"
                  />
                  <span className={`text-sm ${selectedCategories.includes(c.name) ? "text-[#FF8C00] font-semibold" : "text-gray-600 group-hover:text-[#FF8C00]"}`}>
                    {c.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">
              Khoảng giá
            </h4>
            <div className="flex flex-row items-center gap-2 mb-3">
              <input 
                type="number" 
                placeholder="Tối thiểu" 
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm text-center outline-none focus:border-[#FF8C00]"
              />
              <span className="text-gray-400 font-bold">-</span>
              <input 
                type="number" 
                placeholder="Tối đa" 
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm text-center outline-none focus:border-[#FF8C00]"
              />
            </div>
            <button 
              onClick={handleApplyPrice}
              className="w-full py-1.5 mt-2 bg-orange-500 text-white font-medium rounded text-sm hover:bg-orange-600 transition uppercase"
            >
              Áp dụng
            </button>
          </div>

        </div>
      </div>

      {/* 3. Cột phải (Main Product Area - Chiếm 75% chiều rộng) */}
      <div className="w-3/4 flex-grow">
        <div className="flex flex-col gap-6">
          
          {/* Header Area */}
          <div className="flex items-center justify-between bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <SlidersHorizontal size={20} className="text-[#FF8C00]" /> 
                {selectedCategories.length > 0 ? `${selectedCategories.length} danh mục đã chọn` : "Tất cả sản phẩm"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Tìm thấy {filteredProducts.length} kết quả
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer hover:bg-gray-100 transition-colors focus:border-[#FF8C00]"
              >
                <option value="">Sắp xếp mặc định</option>
                <option value="newest">Hàng mới nhất</option>
                <option value="bestSelling">Bán chạy nhất</option>
                <option value="priceAsc">Giá: Thấp đến Cao</option>
                <option value="priceDesc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          {/* Lưới Thẻ sản phẩm */}
          <div className="w-full">
            {loading ? (
              <div className="grid grid-cols-4 gap-4">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-md aspect-square animate-pulse"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-16 text-center flex flex-col items-center gap-3 border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-2">🔎</div>
                <h3 className="text-lg font-bold text-gray-800">Không tìm thấy sản phẩm</h3>
                <p className="text-gray-500 text-sm">Rất tiếc, không có sản phẩm nào phù hợp với bộ lọc của bạn.</p>
                <button 
                  onClick={() => { setSelectedCategories([]); setAppliedPriceRange({min:"", max:""}); setPriceMin(""); setPriceMax(""); setSortOrder(""); }} 
                  className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-md transition-colors"
                >
                  XÓA BỘ LỌC
                </button>
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-4 gap-4"
              >
                <AnimatePresence>
                  {filteredProducts.map(p => (
                    <SmartProductCard 
                      key={p.id} 
                      product={p} 
                      onAddToCart={addToCart} 
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Shop;
