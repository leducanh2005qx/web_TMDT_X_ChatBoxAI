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
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
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
      }
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
      headers: {
        Authorization: "Bearer " + token,
      },
    }).then(load);
  };

  return (
    <div className="admin-categories">
      <h1>📂 Quản lý danh mục</h1>

      <div className="category-form">
        <h2>{editing ? "✏️ Sửa danh mục" : "➕ Thêm danh mục"}</h2>

        <form onSubmit={submit}>
          <input
            placeholder="Tên danh mục (VD: Đồ ăn)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button type="submit">{editing ? "Cập nhật" : "Thêm"}</button>
        </form>
      </div>

      <div className="category-list">
        <h2>📋 Danh sách danh mục</h2>

        {categories.length === 0 ? (
          <div className="category-empty">Chưa có danh mục nào</div>
        ) : (
          <table className="category-table">
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="category-actions">
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditing(c);
                        setName(c.name);
                      }}
                    >
                      Sửa
                    </button>
                    <button className="delete-btn" onClick={() => del(c.id)}>
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminCategories;
