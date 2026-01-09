import { useEffect, useState } from "react";
import "../../pages/admin/Admin.css";
import { getCategories } from "../../services/api";

function AdminProductForm({ onSubmit, editingProduct, onCancel }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // load categories
  useEffect(() => {
    getCategories().then((data) => {
      setCategories(Array.isArray(data) ? data : []);
    });
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setPrice(editingProduct.price);
      setDescription(editingProduct.description || "");
      setStock(editingProduct.stock ?? "");
      setCategoryId(
        editingProduct.category_id ? String(editingProduct.category_id) : ""
      );

      setPreview(
        editingProduct.image
          ? `http://localhost:5000/${editingProduct.image}`
          : null
      );
    } else {
      setName("");
      setPrice("");
      setDescription("");
      setStock("");
      setCategoryId("");
      setImage(null);
      setPreview(null);
    }
  }, [editingProduct]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("stock", stock);
    formData.append("category_id", categoryId); // ✅ gửi category_id
    if (image) formData.append("image", image);

    onSubmit(formData);
  };

  return (
    <div className="admin-form">
      <h3>{editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h3>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          placeholder="Tên sản phẩm"
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="number"
          value={price}
          placeholder="Giá"
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          type="number"
          value={stock}
          placeholder="Số lượng tồn kho"
          onChange={(e) => setStock(e.target.value)}
          min="0"
        />

        {/* ✅ CHỌN DANH MỤC */}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
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
          value={description}
          placeholder="Mô tả sản phẩm"
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        <input type="file" accept="image/*" onChange={handleImageChange} />

        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{ width: 120, marginTop: 10 }}
          />
        )}

        <button type="submit" className="btn-primary">
          {editingProduct ? "Cập nhật" : "Thêm"}
        </button>

        {editingProduct && (
          <button type="button" onClick={onCancel}>
            Hủy
          </button>
        )}
      </form>
    </div>
  );
}

export default AdminProductForm;
