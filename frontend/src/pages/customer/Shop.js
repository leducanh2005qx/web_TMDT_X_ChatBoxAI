import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { getProducts, getCategories } from "../../services/api";
import SmartProductCard from "../../components/customer/SmartProductCard";

function Shop({ keyword, addToCart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortOrder, setSortOrder] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dynamic filter states
  const [techFilters, setTechFilters] = useState({ ram: "all", storage: "all" });
  const [fashionFilters, setFashionFilters] = useState({ color: "all", size: "all" });

  useEffect(() => {
    setLoading(true);
    Promise.all([getProducts(), getCategories()]).then(([pData, cData]) => {
      setProducts(Array.isArray(pData) ? pData : []);
      setCategories(Array.isArray(cData) ? cData : []);
      setLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category Filter
    if (selectedCategory !== "all") {
      list = list.filter(p => p.category === selectedCategory || p.category_name === selectedCategory);
    }

    // Search Keyword
    const k = (keyword || "").toLowerCase();
    if (k) list = list.filter(p => p.name.toLowerCase().includes(k));

    // Price Filter
    if (priceRange === "under500k") list = list.filter(p => Number(p.price) < 500000);
    else if (priceRange === "500k-2m") list = list.filter(p => Number(p.price) >= 500000 && Number(p.price) <= 2000000);
    else if (priceRange === "over2m") list = list.filter(p => Number(p.price) > 2000000);

    // Dynamic Category Filters
    if (selectedCategory === "Điện tử" || selectedCategory === "Electronics") {
      if (techFilters.ram !== "all") list = list.filter(p => p.specifications?.ram === techFilters.ram);
      if (techFilters.storage !== "all") list = list.filter(p => p.specifications?.storage === techFilters.storage);
    } else if (selectedCategory === "Thời trang" || selectedCategory === "Fashion") {
      // Assuming specifications contains colors/sizes
      if (fashionFilters.color !== "all") list = list.filter(p => p.specifications?.colors?.includes(fashionFilters.color));
    }

    // Sorting
    if (sortOrder === "priceAsc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortOrder === "priceDesc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortOrder === "newest") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return list;
  }, [products, selectedCategory, keyword, priceRange, sortOrder, techFilters, fashionFilters]);

  const renderDynamicFilters = () => {
    if (selectedCategory === "Điện tử" || selectedCategory === "Electronics") {
      return (
        <div className="flex flex-col gap-4 py-4 border-b">
           <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Cấu hình</h4>
           <div className="flex flex-wrap gap-2">
              {["4GB", "8GB", "16GB"].map(r => (
                <button 
                  key={r} 
                  onClick={() => setTechFilters({...techFilters, ram: techFilters.ram === r ? "all" : r})}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${techFilters.ram === r ? "bg-[#FF8C00] text-white border-transparent" : "bg-white border-gray-200"}`}
                >
                  RAM {r}
                </button>
              ))}
           </div>
        </div>
      );
    }
    if (selectedCategory === "Thời trang" || selectedCategory === "Fashion") {
      return (
        <div className="flex flex-col gap-4 py-4 border-b">
           <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Màu sắc</h4>
           <div className="flex gap-3">
              {["#000", "#FFF", "#FF0000", "#0000FF"].map(c => (
                <button 
                  key={c}
                  onClick={() => setFashionFilters({...fashionFilters, color: fashionFilters.color === c ? "all" : c})}
                  className={`w-6 h-6 rounded-full border-2 ${fashionFilters.color === c ? "border-[#FF8C00] scale-125" : "border-white"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
           </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* SHOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SlidersHorizontal size={24} className="text-[#FF8C00]" /> 
            {selectedCategory === "all" ? "Tất cả sản phẩm" : selectedCategory}
          </h1>
          <p className="text-sm text-gray-400 font-medium">Tìm thấy {filteredProducts.length} kết quả</p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold outline-none cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <option value="">🔃 Sắp xếp</option>
            <option value="newest">Mới nhất</option>
            <option value="priceAsc">Giá: Thấp đến Cao</option>
            <option value="priceDesc">Giá: Cao đến Thấp</option>
          </select>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`lg:hidden p-2.5 rounded-xl transition-all ${isFilterOpen ? "bg-[#FF8C00] text-white" : "bg-gray-50 text-gray-600"}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* SIDEBAR FILTERS (Desktop) */}
        <aside className={`fixed inset-0 z-[60] lg:relative lg:z-0 lg:block w-72 h-full bg-white lg:bg-transparent transition-transform duration-300 ${isFilterOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="h-full lg:h-auto bg-white p-8 lg:rounded-3xl border border-gray-100 shadow-sm overflow-y-auto">
            <div className="flex items-center justify-between lg:hidden mb-8">
               <h3 className="text-xl font-bold">Bộ lọc</h3>
               <button onClick={() => setIsFilterOpen(false)}><X /></button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Categories */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Danh mục</h4>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setSelectedCategory("all")}
                    className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedCategory === "all" ? "bg-orange-50 text-[#FF8C00]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    Tất cả
                  </button>
                  {categories.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => setSelectedCategory(c.name)}
                      className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedCategory === c.name ? "bg-orange-50 text-[#FF8C00]" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Filters */}
              {renderDynamicFilters()}

              {/* Price Range */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Khoảng giá</h4>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Tất cả", value: "all" },
                    { label: "Dưới 500k", value: "under500k" },
                    { label: "500k - 2 triệu", value: "500k-2m" },
                    { label: "Trên 2 triệu", value: "over2m" }
                  ].map(p => (
                    <label key={p.value} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="price" 
                        value={p.value} 
                        checked={priceRange === p.value}
                        onChange={() => setPriceRange(p.value)}
                        className="w-4 h-4 accent-[#FF8C00]"
                      />
                      <span className={`text-sm font-bold group-hover:text-[#FF8C00] transition-colors ${priceRange === p.value ? "text-[#FF8C00]" : "text-gray-600"}`}>
                        {p.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <div className="flex-1">
          {loading ? (
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse"></div>
                ))}
             </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center flex flex-col items-center gap-4 border border-dashed border-gray-200">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl">🔎</div>
               <h3 className="text-xl font-bold">Không tìm thấy sản phẩm</h3>
               <p className="text-gray-400 text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác nhé!</p>
               <button onClick={() => { setSelectedCategory("all"); setPriceRange("all"); }} className="tiger-btn mt-4">XÓA BỘ LỌC</button>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8"
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
  );
}

export default Shop;
