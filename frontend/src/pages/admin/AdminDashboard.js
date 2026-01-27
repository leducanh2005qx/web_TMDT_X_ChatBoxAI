import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import AdminVariantManager from "../../components/admin/AdminVariantManager";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [image, setImage] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category_id: "",
    description: "",
  });

  const token = localStorage.getItem("token");

  /* ===== LOAD DATA ===== */
  const loadProducts = () => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then(setProducts);
  };

  const loadCategories = () => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then(setCategories);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  /* ===== FORM ===== */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
      headers: {
        Authorization: "Bearer " + token,
      },
      body: formData,
    }).then(() => {
      setForm({
        name: "",
        price: "",
        stock: "",
        category_id: "",
        description: "",
      });
      setImage(null);
      setEditing(null);
      loadProducts();
    });
  };

  const editProduct = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      stock: p.stock,
      category_id: p.category_id,
      description: p.description,
    });
  };

  const deleteProduct = (id) => {
    if (!window.confirm("Xoá sản phẩm này?")) return;

    fetch(`http://localhost:5000/api/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    }).then(loadProducts);
  };

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">🛠 Quản lý sản phẩm</h1>

      {/* ===== FORM ===== */}
      <div className="product-form">
        <h2>{editing ? "✏️ Sửa sản phẩm" : "➕ Thêm sản phẩm"}</h2>

        <form onSubmit={submit}>
          <input
            name="name"
            placeholder="Tên sản phẩm"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            name="price"
            placeholder="Giá"
            value={form.price}
            onChange={handleChange}
            required
          />

          <input
            name="stock"
            placeholder="Số lượng"
            value={form.stock}
            onChange={handleChange}
            required
          />

          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <textarea
            name="description"
            placeholder="Mô tả sản phẩm"
            value={form.description}
            onChange={handleChange}
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />

          <button type="submit">
            {editing ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
          </button>
        </form>
      </div>

      {/* ===== VARIANT MANAGER (CHỈ HIỆN KHI SỬA) ===== */}
      {editing && <AdminVariantManager productId={editing.id} />}

      {/* ===== TABLE ===== */}
      <div className="product-table">
        <h2>📦 Danh sách sản phẩm</h2>

        <table>
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Tồn</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <img
                    src={`http://localhost:5000/${p.image}`}
                    alt={p.name}
                    className="thumb"
                  />
                </td>
                <td>{p.name}</td>
                <td>{p.category_name}</td>
                <td>{p.price} đ</td>
                <td>{p.stock}</td>
                <td className="actions">
                  <button onClick={() => editProduct(p)}>Sửa</button>
                  <button
                    className="danger"
                    onClick={() => deleteProduct(p.id)}
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan="6">Chưa có sản phẩm</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
