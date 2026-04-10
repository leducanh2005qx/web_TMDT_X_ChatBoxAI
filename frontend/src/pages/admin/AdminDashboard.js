import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import "./AdminDashboard.css";
import AdminVariantManager from "../../components/admin/AdminVariantManager";
import { getInventoryAlert } from "../../services/api";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [alertData, setAlertData] = useState({ alerts: [], trashCount: 0 });
  const [showTrash, setShowTrash] = useState(false);
  const [trashProducts, setTrashProducts] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [image, setImage] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category_id: "",
    description: "",
  });
  const token = localStorage.getItem("token");

  const loadProducts = () => {
    fetch("http://localhost:5000/api/products")
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi hệ thống server");
        return res.json();
      })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Lỗi:", err);
        setProducts([]);
      });
  };

  const loadCategories = () => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi:", err));
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
    
    // Kiểm tra hàng hóa sắp hết để Tiger nhắc nhở
    getInventoryAlert()
      .then(data => {
        if (data && data.alerts) {
          setAlertData(data);
        } else if (Array.isArray(data)) {
          // Fallback cho version cũ nếu có
          setAlertData({ alerts: data, trashCount: 0 });
        }
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(form).forEach((k) => formData.append(k, form[k]));
    if (image) formData.append("image", image);

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `http://localhost:5000/api/products/${editing.id}`
      : "http://localhost:5000/api/products";

    fetch(url, {
      method,
      headers: { Authorization: "Bearer " + token },
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Thất bại");
        setForm({ name: "", price: "", category_id: "", description: "" });
        setImage(null);
        setEditing(null);
        loadProducts();
        alert("Thành công!");
      })
      .catch((err) => alert(err.message));
  };

  const deleteProduct = (id) => {
    if (
      !window.confirm(
        "Xoá sản phẩm này sẽ xóa tất cả các Size liên quan. Bạn chắc chắn?",
      )
    )
      return;
    fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Lỗi xóa");
        loadProducts();
        alert("Đã xóa xong!");
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
        
        // Refresh alert data to update Tiger's count
        getInventoryAlert().then(setAlertData).catch(console.error);
      })
      .catch((err) => alert(err.message));
  };

  const editProduct = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      category_id: p.category_id,
      description: p.description,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
                    <td><img src={`http://localhost:5000/${tp.image}`} alt={tp.name} style={{ width: '40px', borderRadius: '5px' }} /></td>
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

      <div className="dashboard-layout-grid">
        <div className="editor-aside">
          <div className="card glass-card">
            <h2 className="card-title">
              {editing ? "✏️ Hiệu chỉnh" : "➕ Thêm mới"}
            </h2>
            <form className="modern-form" onSubmit={submit}>
              <div className="form-group">
                <label>Tên sản phẩm</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Giá</label>
                  <input
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Danh mục</label>
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Chọn nhóm</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  rows="3"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Ảnh</label>
                <input
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>
              <div className="action-bar">
                <button type="submit" className="btn-save">
                  Lưu
                </button>
                {editing && (
                  <button
                    type="button"
                    className="btn-discard"
                    onClick={() => setEditing(null)}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </div>
          {editing && (
            <AdminVariantManager
              productId={editing.id}
              onUpdate={loadProducts}
            />
          )}
        </div>

        <div className="table-main">
          <div className="card table-card">
            <h2 className="card-title">📦 Danh sách hàng tồn</h2>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Thông tin</th>
                  <th>Size & Kho</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <img
                        src={`http://localhost:5000/${p.image}`}
                        className="product-avatar"
                        alt=""
                      />
                    </td>
                    <td className="info-cell">
                      <span className="p-name">{p.name}</span>
                      <span className="p-cat">{p.category_name}</span>
                      <span className="p-price">
                        {Number(p.price).toLocaleString()}đ
                      </span>
                    </td>
                    <td className="stock-cell">
                      <div className="variant-badges-container">
                        {p.variants?.length > 0 ? (
                          p.variants.map((v, i) => (
                            <div
                              key={i}
                              className={`size-badge ${v.stock === 0 ? "out" : ""}`}
                            >
                              {v.variant_name}:{" "}
                              <span className="qty">{v.stock}</span>
                            </div>
                          ))
                        ) : (
                          <span className="empty-stock-text">
                            Chưa cấu hình Size
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="action-cell text-right">
                      <button
                        className="icon-btn edit"
                        onClick={() => editProduct(p)}
                      >
                        Sửa
                      </button>
                      <button
                        className="icon-btn delete"
                        onClick={() => deleteProduct(p.id)}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
