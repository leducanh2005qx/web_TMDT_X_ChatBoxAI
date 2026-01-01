import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
} from "../../services/api";

import Header from "../../components/layout/Header";
import AdminProductForm from "../../components/admin/AdminProductForm";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const navigate = useNavigate();

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAdd = async (formData) => {
    await createProduct(formData);
    loadProducts();
  };

  const handleUpdate = async (formData) => {
    await updateProduct(editingProduct.id, formData);
    setEditingProduct(null);
    loadProducts();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xóa sản phẩm này?")) {
      await deleteProduct(id);
      loadProducts();
    }
  };

  return (
    <>
      {/* HEADER */}
      <Header />

      <div className="admin-layout">
        {/* SIDEBAR */}
        <div className="admin-sidebar">
          <h2>ADMIN</h2>
          <ul>
            <li onClick={() => navigate("/admin/dashboard")}>
              📦 Quản lý sản phẩm
            </li>
            <li onClick={() => navigate("/admin/orders")}>🧾 Đơn hàng</li>
            <li onClick={() => navigate("/admin/stats")}>📊 Thống kê</li>
          </ul>
        </div>

        {/* CONTENT */}
        <div className="admin-content">
          <div className="admin-header">Quản lý sản phẩm</div>

          <AdminProductForm
            onSubmit={editingProduct ? handleUpdate : handleAdd}
            editingProduct={editingProduct}
            onCancel={() => setEditingProduct(null)}
          />

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ảnh</th>
                <th>Tên</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>

                  {/* ẢNH */}
                  <td>
                    {p.image ? (
                      <img
                        src={`http://localhost:5000/${p.image}`}
                        alt={p.name}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                      />
                    ) : (
                      <span>Không ảnh</span>
                    )}
                  </td>

                  <td>{p.name}</td>

                  <td>{Number(p.price).toLocaleString()} đ</td>

                  {/* TỒN KHO */}
                  <td>
                    {p.stock > 0 ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>
                        {p.stock}
                      </span>
                    ) : (
                      <span style={{ color: "red", fontWeight: "bold" }}>
                        Hết hàng
                      </span>
                    )}
                  </td>

                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => setEditingProduct(p)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(p.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    Chưa có sản phẩm
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
