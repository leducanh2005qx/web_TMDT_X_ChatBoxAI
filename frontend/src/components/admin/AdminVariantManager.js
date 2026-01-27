import { useEffect, useState, useCallback } from "react";
import "./AdminVariantManager.css";

function AdminVariantManager({ productId }) {
  const [variants, setVariants] = useState([]);
  const [variantName, setVariantName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const token = localStorage.getItem("token");

  // ===== LOAD VARIANTS =====
  const loadVariants = useCallback(() => {
    if (!productId) return;

    fetch(`http://localhost:5000/api/variants/product/${productId}`)
      .then((res) => res.json())
      .then(setVariants);
  }, [productId]);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  // ===== ADD VARIANT =====
  const addVariant = (e) => {
    e.preventDefault();

    fetch("http://localhost:5000/api/variants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        product_id: productId,
        variant_name: variantName,
        price,
        stock,
      }),
    }).then(() => {
      setVariantName("");
      setPrice("");
      setStock("");
      loadVariants();
    });
  };

  // ===== DELETE VARIANT =====
  const deleteVariant = (id) => {
    if (!window.confirm("Xoá biến thể này?")) return;

    fetch(`http://localhost:5000/api/variants/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    }).then(loadVariants);
  };

  return (
    <div className="variant-card">
      {/* ===== HEADER ===== */}
      <div className="variant-header">
        <div>
          <h2 className="variant-title">📐 Biến thể sản phẩm</h2>
          <p className="variant-subtitle">
            Quản lý size / loại / phiên bản và tồn kho
          </p>
        </div>
      </div>

      {/* ===== LIST ===== */}
      <div className="variant-list">
        {variants.map((v) => (
          <div className="variant-row" key={v.id}>
            <div className="variant-badge">
              <span className="variant-dot" />
              <span>{v.variant_name}</span>
            </div>

            <div className="variant-price">
              {Number(v.price).toLocaleString()} đ
            </div>

            <div className="variant-stock">Kho: {v.stock}</div>

            <button
              className="btn btn-danger"
              onClick={() => deleteVariant(v.id)}
            >
              Xoá
            </button>
          </div>
        ))}

        {variants.length === 0 && (
          <div className="variant-empty">Chưa có biến thể cho sản phẩm này</div>
        )}
      </div>

      {/* ===== FORM ===== */}
      <form className="variant-form" onSubmit={addVariant}>
        <input
          className="variant-input"
          placeholder="Tên biến thể (Size M, Gói 10 cái...)"
          value={variantName}
          onChange={(e) => setVariantName(e.target.value)}
          required
        />

        <input
          className="variant-input"
          type="number"
          placeholder="Giá"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          className="variant-input"
          type="number"
          placeholder="Tồn kho"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />

        <button className="btn-primary" type="submit">
          ➕ Thêm
        </button>
      </form>
    </div>
  );
}

export default AdminVariantManager;
