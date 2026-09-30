import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

/**
 * ChatCheckoutCard – Card tư vấn mua hàng trong chat
 * Props:
 *   data: { productId, productName, productPrice, productImage }
 *   onAddToCart: fn(product, variant, qty) – từ App.js
 */
export default function ChatCheckoutCard({ data, onAddToCart }) {
  const navigate = useNavigate();
  const [product, setProduct]     = useState(null);
  const [variants, setVariants]   = useState([]);
  const [colors, setColors]       = useState([]);
  const [sizes, setSizes]         = useState([]);
  const [selectedColor, setColor] = useState(null);
  const [selectedSize, setSize]   = useState(null);
  const [qty, setQty]             = useState(1);
  const [loading, setLoading]     = useState(true);
  const [added, setAdded]         = useState(false);

  const productId = data?.productId;

  // ── 1. Fetch thông tin sản phẩm
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/products/${productId}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/variants/product/${productId}`).then(r => r.ok ? r.json() : []),
    ]).then(([prod, vars]) => {
      setProduct(prod);
      const varList = Array.isArray(vars) ? vars : [];
      setVariants(varList);
      setColors([...new Set(varList.map(v => v.color).filter(Boolean))]);
      setSizes([...new Set(varList.map(v => v.size).filter(Boolean))]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [productId]);

  // ── 2. Khi đổi màu → reset size nếu màu mới không có size đó
  useEffect(() => {
    if (!selectedColor) return;
    const availSizes = variants
      .filter(v => v.color === selectedColor)
      .map(v => v.size)
      .filter(Boolean);
    if (selectedSize && !availSizes.includes(selectedSize)) setSize(null);
    setSizes(availSizes.length > 0 ? availSizes : sizes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor]);

  // ── 3. Tìm variant khớp
  const matchedVariant = variants.find(v => {
    const colorOk = !selectedColor || v.color === selectedColor;
    const sizeOk  = !selectedSize  || v.size  === selectedSize;
    return colorOk && sizeOk;
  }) || null;

  const effectivePrice = matchedVariant?.price ?? product?.price ?? data?.productPrice ?? 0;
  const stock = matchedVariant?.stock ?? product?.stock ?? 0;
  const imageUrl = product?.image
    ? (product.image.startsWith("http") ? product.image : `${API_URL.replace("/api","")}/${product.image}`)
    : data?.productImage || null;

  const canAddToCart = stock > 0 && qty >= 1 && qty <= stock;

  // ── 4. Handlers
  function handleAddToCart() {
    if (!product || !canAddToCart) return;
    if (onAddToCart) onAddToCart(product, matchedVariant, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!product || !canAddToCart) return;
    if (onAddToCart) onAddToCart(product, matchedVariant, qty);
    navigate("/cart");
  }

  // ── Render states
  if (!productId) return null;

  if (loading) return (
    <div style={styles.card}>
      <p style={{ color: "#888", fontSize: 13 }}>⏳ Đang tải thông tin sản phẩm…</p>
    </div>
  );

  if (!product) return (
    <div style={styles.card}>
      <p style={{ color: "#e74c3c", fontSize: 13 }}>❌ Không tìm thấy sản phẩm.</p>
    </div>
  );

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <span>🛒</span>
        <strong style={{ fontSize: 14, color: "#FF7A00" }}>Đề xuất mua hàng</strong>
      </div>

      {/* Product info */}
      <div style={styles.productRow}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={product.name}
            style={styles.image}
            onError={e => { e.target.style.display = "none"; }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={styles.productName}>{product.name}</p>
          <p style={styles.price}>{Number(effectivePrice).toLocaleString("vi-VN")}₫</p>
          {stock > 0
            ? <p style={{ fontSize: 11, color: "#27ae60" }}>✔ Còn hàng ({stock} chiếc)</p>
            : <p style={{ fontSize: 11, color: "#e74c3c" }}>✖ Hết hàng</p>
          }
        </div>
      </div>

      {/* Color picker */}
      {colors.length > 0 && (
        <div style={styles.optionRow}>
          <span style={styles.label}>Màu:</span>
          <div style={styles.chipGroup}>
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c === selectedColor ? null : c)}
                style={{
                  ...styles.chip,
                  background: c === selectedColor ? "#FF7A00" : "#f0f0f0",
                  color:      c === selectedColor ? "#fff"    : "#333",
                  border:     c === selectedColor ? "1.5px solid #FF7A00" : "1.5px solid #ddd",
                }}
              >{c}</button>
            ))}
          </div>
        </div>
      )}

      {/* Size picker */}
      {sizes.length > 0 && (
        <div style={styles.optionRow}>
          <span style={styles.label}>Size:</span>
          <div style={styles.chipGroup}>
            {sizes.map(s => {
              const available = !selectedColor || variants.some(v => v.color === selectedColor && v.size === s);
              return (
                <button
                  key={s}
                  disabled={!available}
                  onClick={() => setSize(s === selectedSize ? null : s)}
                  style={{
                    ...styles.chip,
                    background: s === selectedSize ? "#FF7A00" : "#f0f0f0",
                    color:      s === selectedSize ? "#fff"    : available ? "#333" : "#bbb",
                    border:     s === selectedSize ? "1.5px solid #FF7A00" : "1.5px solid #ddd",
                    opacity:    available ? 1 : 0.45,
                    cursor:     available ? "pointer" : "not-allowed",
                  }}
                >{s}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div style={{ ...styles.optionRow, alignItems: "center" }}>
        <span style={styles.label}>Số lượng:</span>
        <div style={styles.qtyRow}>
          <button style={styles.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
          <span style={styles.qtyNum}>{qty}</span>
          <button style={styles.qtyBtn} onClick={() => setQty(q => Math.min(stock || 99, q + 1))}>+</button>
        </div>
      </div>

      {/* Action buttons */}
      <div style={styles.btnRow}>
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          style={{
            ...styles.btnOutline,
            opacity: canAddToCart ? 1 : 0.5,
            cursor:  canAddToCart ? "pointer" : "not-allowed",
          }}
        >
          {added ? "✔ Đã thêm!" : "🛒 Thêm vào giỏ"}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!canAddToCart}
          style={{
            ...styles.btnPrimary,
            opacity: canAddToCart ? 1 : 0.5,
            cursor:  canAddToCart ? "pointer" : "not-allowed",
          }}
        >
          ⚡ Mua ngay
        </button>
      </div>

      {/* Link to product detail */}
      <button
        onClick={() => navigate(`/product/${product.id}`)}
        style={styles.linkBtn}
      >
        Xem chi tiết sản phẩm →
      </button>
    </div>
  );
}

/* ── Styles ────────────────────────────────── */
const styles = {
  card: {
    border: "1px solid #ffe0c4",
    borderRadius: 12,
    padding: "12px 14px",
    background: "#fffbf7",
    maxWidth: 300,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    borderBottom: "1px solid #ffe0c4",
    paddingBottom: 6,
  },
  productRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  image: {
    width: 64,
    height: 64,
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid #eee",
    flexShrink: 0,
  },
  productName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#333",
    margin: 0,
    lineHeight: 1.35,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  price: {
    fontSize: 15,
    fontWeight: 700,
    color: "#FF7A00",
    margin: "3px 0",
  },
  optionRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  label: {
    fontSize: 12,
    color: "#666",
    minWidth: 56,
    paddingTop: 4,
  },
  chipGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
  },
  chip: {
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    cursor: "pointer",
    transition: "all .15s",
    fontWeight: 500,
  },
  qtyRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#f5f5f5",
    borderRadius: 20,
    padding: "2px 10px",
  },
  qtyBtn: {
    background: "none",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
    color: "#FF7A00",
    fontWeight: 700,
    padding: "0 4px",
  },
  qtyNum: {
    fontSize: 14,
    fontWeight: 600,
    minWidth: 20,
    textAlign: "center",
  },
  btnRow: {
    display: "flex",
    gap: 8,
    marginTop: 2,
  },
  btnOutline: {
    flex: 1,
    padding: "7px 0",
    border: "1.5px solid #FF7A00",
    borderRadius: 8,
    background: "#fff",
    color: "#FF7A00",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  btnPrimary: {
    flex: 1,
    padding: "7px 0",
    border: "none",
    borderRadius: 8,
    background: "#FF7A00",
    color: "#fff",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#999",
    fontSize: 11,
    cursor: "pointer",
    textDecoration: "underline",
    padding: 0,
    textAlign: "left",
  },
};
