import { useEffect, useState } from "react";
import "./AdminCategories.css";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const token = localStorage.getItem("token");

  const load = () => {
    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    fetch(
      editing
        ? `http://localhost:5000/api/categories/${editing.id}`
        : "http://localhost:5000/api/categories",
      {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ name }),
      },
    ).then(() => {
      setName("");
      setEditing(null);
      load();
    });
  };

  const del = (id) => {
    if (!window.confirm("Xoá danh mục này?")) return;
    fetch(`http://localhost:5000/api/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    }).then(load);
  };

  return (
    <div className="admin-categories-page">
      <header className="page-header">
        <h1>📂 Quản lý danh mục TIGER SHOP</h1>
        <div className="stat-card">
          <span>TỔNG DANH MỤC</span>
          <strong>{categories.length}</strong>
        </div>
      </header>

      <div className="admin-grid-layout">
        {/* CỘT TRÁI: FORM NHẬP (Đồng bộ với phần Thêm mới sản phẩm) */}
        <div className="glass-card form-column">
          <h3>{editing ? "✏️ Sửa danh mục" : "➕ Thêm mới"}</h3>
          <form onSubmit={submit}>
            <div className="form-group-premium">
              <label>Tên danh mục</label>
              <input
                placeholder="VD: Thời trang, Đồ ăn..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-main-submit">
              {editing ? "Cập nhật ngay" : "Lưu danh mục"}
            </button>
            {editing && (
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setEditing(null);
                  setName("");
                }}
              >
                Hủy bỏ
              </button>
            )}
          </form>
        </div>

        {/* CỘT PHẢI: DANH SÁCH (Đồng bộ với bảng Danh sách hàng tồn) */}
        <div className="glass-card list-column">
          <h3>📋 Danh sách phân loại</h3>
          {categories.length === 0 ? (
            <div className="empty-state">Chưa có danh mục nào được tạo</div>
          ) : (
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Tên danh mục</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="category-name">{c.name}</td>
                      <td className="category-actions text-right">
                        <button
                          className="btn-action edit"
                          onClick={() => {
                            setEditing(c);
                            setName(c.name);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn-action delete"
                          onClick={() => del(c.id)}
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCategories;
