import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Plus } from "lucide-react";
import "./AdminDashboard.css";
import { getInventoryAlert } from "../../services/api";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [alertData, setAlertData] = useState({ alerts: [], trashCount: 0 });
  const [showTrash, setShowTrash] = useState(false);
  const [trashProducts, setTrashProducts] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  
  // Toolbar states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const token = localStorage.getItem("token");

  const loadProducts = useCallback(() => {
    fetch("http://localhost:5000/api/products", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi hệ thống server");
        return res.json();
      })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Lỗi:", err);
        setProducts([]);
      });
  }, [token]);

  const loadCategories = useCallback(() => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi:", err));
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
    
    getInventoryAlert()
      .then(data => {
        if (data && data.alerts) {
          setAlertData(data);
        } else if (Array.isArray(data)) {
          setAlertData({ alerts: data, trashCount: 0 });
        }
      })
      .catch(console.error);
  }, [loadProducts, loadCategories]);

  const deleteProduct = (id) => {
    if (!window.confirm("Xoá sản phẩm này sẽ chuyển vào thùng rác. Bạn chắc chắn?")) return;
    fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Lỗi xóa");
        loadProducts();
        alert("Đã xóa xong!");
        if (showTrash) loadTrash();
        getInventoryAlert().then(setAlertData).catch(console.error);
      })
      .catch((err) => alert(err.message));
  };

  const loadTrash = () => {
    setLoadingTrash(true);
    fetch("http://localhost:5000/api/products?deleted=true", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => setTrashProducts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi:", err))
      .finally(() => setLoadingTrash(false));
  };

  const handleRestore = (id) => {
    fetch(`http://localhost:5000/api/products/${id}/restore`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Khôi phục thất bại");
        alert("Đã khôi phục sản phẩm!");
        loadProducts();
        if (showTrash) loadTrash();
        getInventoryAlert().then(setAlertData).catch(console.error);
      })
      .catch((err) => alert(err.message));
  };

  // Lọc sản phẩm
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory ? String(p.category_id) === String(filterCategory) : true;
    return matchSearch && matchCat;
  });

  const getBadgeColor = (categoryName) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('thời trang')) return 'bg-pink-100 text-pink-700 border-pink-200';
    if (name.includes('điện tử')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (name.includes('thực phẩm')) return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-top-bar">
        <div className="header-info">
          <h1 className="main-title">📦 Quản trị kho TIGER SHOP</h1>
        </div>
        <div className="stat-card-mini">
          <span className="stat-label">Tổng sản phẩm</span>
          <span className="stat-value">{products.length}</span>
        </div>
      </div>
      
      {(alertData.alerts.length > 0 || alertData.trashCount > 0) && (
        <div className="card glass-card" style={{ marginBottom: "20px", borderLeft: "5px solid #ffcc00", backgroundColor: "#fffbea" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span style={{ fontSize: "2rem" }}>🐅</span>
            <div>
              <h4 style={{ margin: "0 0 5px 0", color: "#b38f00" }}>Trợ lý Tiger báo cáo:</h4>
              <p style={{ margin: 0, color: "#333", fontSize: "1.1rem" }}>
                Sếp Đức Anh ơi, 
                {alertData.alerts.length > 0 && (
                  <> có <b>{alertData.alerts.length}</b> mặt hàng sắp hết rồi, nhắc Manager nhập thêm đi! ({alertData.alerts.map(p => `${p.name} (còn ${p.stock})`).join(", ")})</>
                )}
                {alertData.trashCount > 0 && (
                  <> {alertData.alerts.length > 0 ? "Ngoài ra còn" : "có"} <b>{alertData.trashCount}</b> sản phẩm đang nằm trong thùng rác, sếp có muốn dọn dẹp hay khôi phục không?</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {alertData.trashCount > 0 && (
        <button 
          className="btn-trash-toggle" 
          onClick={() => {
            setShowTrash(!showTrash);
            if (!showTrash) loadTrash();
          }}
          style={{ marginBottom: '20px', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: showTrash ? '#eee' : '#fff', cursor: 'pointer' }}
        >
          {showTrash ? '🙈 Đóng thùng rác' : `🗑️ Xem thùng rác (${alertData.trashCount})`}
        </button>
      )}

      {showTrash && (
        <div className="card trash-card" style={{ marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '15px' }}>
          <h3 className="card-title">🗑️ Sản phẩm đã xóa (Soft Delete)</h3>
          {loadingTrash ? <p>Đang tải...</p> : trashProducts.length === 0 ? <p>Thùng rác trống.</p> : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {trashProducts.map(tp => (
                  <tr key={tp.id}>
                    <td><img src={tp.image?.startsWith('http') ? tp.image : `http://localhost:5000/${tp.image}`} alt={tp.name} style={{ width: '40px', borderRadius: '5px' }} /></td>
                    <td>{tp.name}</td>
                    <td>
                      <button className="icon-btn edit" onClick={() => handleRestore(tp.id)}>Khôi phục</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 flex items-center justify-between gap-4">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative w-1/3 min-w-[250px]">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input 
              type="text" 
              className="w-full pl-10 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[#ee4d2d]" 
              placeholder="Tìm tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative w-1/4 min-w-[200px]">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <select 
              className="w-full pl-10 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-[#ee4d2d] bg-white"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <Link to="/admin/add-product" className="flex items-center gap-2 bg-[#ee4d2d] hover:bg-[#d73f22] text-white px-5 py-2.5 rounded-md font-medium transition-colors shadow-sm">
          <Plus size={20} /> Thêm sản phẩm mới
        </Link>
      </div>

      <div className="w-full">
        <div className="card table-card overflow-x-auto">
          <h2 className="card-title mb-4">📦 Danh sách hàng tồn</h2>
          <table className="modern-table min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="pb-3 text-gray-500 font-semibold uppercase text-xs">Ảnh</th>
                <th className="pb-3 text-gray-500 font-semibold uppercase text-xs w-[35%]">Thông tin</th>
                <th className="pb-3 text-gray-500 font-semibold uppercase text-xs">Loại hàng</th>
                <th className="pb-3 text-gray-500 font-semibold uppercase text-xs">Size & Kho</th>
                <th className="pb-3 text-right text-gray-500 font-semibold uppercase text-xs">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} className="table-row border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-2">
                    <img
                      src={p.image?.startsWith('http') ? p.image : `http://localhost:5000/${p.image}`}
                      className="w-20 h-20 object-cover rounded-md border border-gray-200 shadow-sm"
                      alt={p.name}
                    />
                  </td>
                  <td className="py-4 pr-4">
                    <span className="block font-bold text-lg text-gray-800 mb-1">{p.name}</span>
                    <span className="block font-bold text-[#ee4d2d] text-[15px]">
                      {Number(p.price).toLocaleString()} ₫
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(p.category_name)}`}>
                      {p.category_name || 'Khác'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="variant-badges-container flex flex-wrap gap-2">
                      {p.variants?.length > 0 ? (
                        p.variants.map((v, i) => (
                          <div
                            key={i}
                            className={`px-3 py-1.5 rounded-md border text-sm shadow-sm bg-white ${v.stock === 0 ? "border-red-300 text-red-600 bg-red-50" : "border-gray-200 text-gray-700"}`}
                          >
                            <span className="mr-2 opacity-80">{v.variant_name}</span>
                            <strong className="font-bold">{v.stock}</strong>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-1.5 rounded-md border border-blue-200 text-blue-700 bg-blue-50 text-sm shadow-sm">
                          <span className="mr-2 opacity-80">Tổng kho:</span>
                          <strong className="font-bold">{p.stock}</strong>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <Link to={`/admin/products/edit/${p.id}`} className="inline-block px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-md mr-2 transition-colors">
                      Sửa
                    </Link>
                    <button
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-md transition-colors"
                      onClick={() => deleteProduct(p.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">
                    Không tìm thấy sản phẩm nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
