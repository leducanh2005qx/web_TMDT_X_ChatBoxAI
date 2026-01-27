import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../../services/api";
import "./ProductDetail.css";

function ProductDetail({ cart, setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== LOAD PRODUCT (GIỮ LOGIC CŨ) =====
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
        setSelectedVariant(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ===== LOAD VARIANTS =====
  useEffect(() => {
    if (!product?.id) return;

    fetch(`http://localhost:5000/api/variants/product/${product.id}`)
      .then((res) => res.json())
      .then((data) => setVariants(Array.isArray(data) ? data : []))
      .catch(() => setVariants([]));
  }, [product]);

  // ===== ADD TO CART =====
  const addToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      alert("Vui lòng chọn loại sản phẩm");
      return;
    }

    // 👉 có variant
    if (selectedVariant) {
      const cartKey = `variant-${selectedVariant.id}`;
      const exist = cart.find((i) => i.cartKey === cartKey);

      if (exist) {
        setCart(
          cart.map((i) =>
            i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        );
      } else {
        setCart([
          ...cart,
          {
            cartKey,
            product_id: product.id,
            variant_id: selectedVariant.id,
            name: product.name,
            variant_name: selectedVariant.variant_name,
            price: selectedVariant.price,
            image: product.image,
            quantity: 1,
          },
        ]);
      }
      return;
    }

    // 👉 KHÔNG variant – logic cũ
    const exist = cart.find((i) => i.id === product.id);

    if (exist) {
      setCart(
        cart.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  if (loading) return <p style={{ padding: 40 }}>Đang tải...</p>;
  if (!product) return <p style={{ padding: 40 }}>Không tìm thấy sản phẩm</p>;

  return (
    <div className="product-detail-page">
      <button className="back-btn" onClick={() => navigate("/shop")}>
        ⬅ Quay lại Shop
      </button>

      <div className="product-detail-card">
        <div className="image-box">
          <img
            src={`http://localhost:5000/${product.image}`}
            alt={product.name}
            onError={(e) => (e.target.src = "/no-image.png")}
          />
        </div>

        <div className="info-box">
          <h2>{product.name}</h2>

          <p className="price">
            {(selectedVariant?.price ?? product.price).toLocaleString()} đ
          </p>

          <p className="stock">
            Tồn kho: {selectedVariant?.stock ?? product.stock}
          </p>

          {/* ===== VARIANT UI ===== */}
          {variants.length > 0 && (
            <div className="variant-block">
              <div className="variant-label">Chọn loại</div>

              <div className="variant-grid">
                {variants.map((v) => (
                  <div
                    key={v.id}
                    className={`variant-chip ${
                      selectedVariant?.id === v.id ? "active" : ""
                    } ${v.stock <= 0 ? "disabled" : ""}`}
                    onClick={() => v.stock > 0 && setSelectedVariant(v)}
                  >
                    {v.variant_name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="desc">
            {product.description || "Chưa có mô tả sản phẩm"}
          </p>

          <button
            className="add-cart-btn"
            disabled={
              variants.length > 0
                ? !selectedVariant || selectedVariant.stock === 0
                : product.stock === 0
            }
            onClick={addToCart}
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
