import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProductById,
  getProductReviews,
  submitProductReview,
} from "../../services/api";
import "./ProductDetail.css";

function ProductDetail({ cart, setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const imgRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [myReviewImage, setMyReviewImage] = useState(null);

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

  useEffect(() => {
    if (!product?.id) return;
    fetch(`http://localhost:5000/api/variants/product/${product.id}`)
      .then((res) => res.json())
      .then((data) => setVariants(Array.isArray(data) ? data : []))
      .catch(() => setVariants([]));
  }, [product]);

  useEffect(() => {
    if (!id) return;
    getProductReviews(id)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]));
  }, [id]);

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      alert("Vui lòng chọn loại sản phẩm!");
      return;
    }

    // --- HIỆU ỨNG BAY VÀO GIỎ (Đồng bộ Premium) ---
    const cartIcon = document.querySelector(".cart-icon-nav");
    if (imgRef.current && cartIcon) {
      const imgClone = imgRef.current.cloneNode();
      const imgRect = imgRef.current.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      Object.assign(imgClone.style, {
        position: "fixed",
        zIndex: "9999",
        borderRadius: "15px",
        width: imgRect.width + "px",
        height: imgRect.height + "px",
        top: imgRect.top + "px",
        left: imgRect.left + "px",
        transition: "all 0.9s cubic-bezier(0.19, 1, 0.22, 1)",
        boxShadow: "0 10px 30px rgba(59, 130, 246, 0.5)",
        pointerEvents: "none",
      });

      document.body.appendChild(imgClone);

      setTimeout(() => {
        Object.assign(imgClone.style, {
          width: "30px",
          height: "30px",
          top: cartRect.top + "px",
          left: cartRect.left + "px",
          opacity: "0.2",
          transform: "rotate(360deg) scale(0)",
        });
      }, 50);

      setTimeout(() => imgClone.remove(), 1000);
    }

    // --- LOGIC GIỎ HÀNG ---
    const cartKey = selectedVariant
      ? `variant-${selectedVariant.id}`
      : product.id;
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
          variant_id: selectedVariant?.id || null,
          name: product.name,
          variant_name: selectedVariant?.variant_name || null,
          price: selectedVariant?.price || product.price,
          image: product.image,
          stock: selectedVariant?.stock || product.stock,
          quantity: 1,
        },
      ]);
    }
  };

  const handleSubmitReview = async () => {
    try {
      const formData = new FormData();
      formData.append("rating", String(myRating));
      formData.append("comment", myComment || "");
      if (myReviewImage) formData.append("image", myReviewImage);
      await submitProductReview(id, formData);
      setMyComment("");
      setMyReviewImage(null);
      const data = await getProductReviews(id);
      setReviews(Array.isArray(data) ? data : []);
      alert("Đã gửi đánh giá sản phẩm");
    } catch (err) {
      alert(err.message || "Không thể gửi đánh giá");
    }
  };

  if (loading)
    return (
      <div className="premium-loader">
        <span>✨ TIGER LOADING...</span>
      </div>
    );
  if (!product) return <div className="error-msg">Không tìm thấy sản phẩm</div>;

  const isOutOfStock =
    variants.length > 0
      ? selectedVariant && selectedVariant.stock <= 0
      : product.stock <= 0;

  return (
    <div className="detail-page-wrapper">
      {/* Nền động giống trang Shop */}
      <div className="dynamic-blobs">
        <div className="blob b1"></div>
        <div className="blob b2"></div>
      </div>

      <div className="detail-container">
        <div className="glass-card-detail">
          {/* Cột trái: Hình ảnh */}
          <div className="image-display-section">
            <button className="back-btn" onClick={() => navigate(-1)}>
              ✕
            </button>
            <div className="main-img-container">
              <img
                ref={imgRef}
                src={product.image?.startsWith('http') ? product.image : `http://localhost:5000/${product.image}`}
                alt={product.name}
                className="main-product-img"
                onError={(e) => (e.target.src = "/no-image.png")}
              />
            </div>
          </div>

          {/* Cột phải: Thông tin */}
          <div className="product-info-panel">
            <header>
              <div className="cat-tag">TIGER PREMIUM</div>
              <h1 className="detail-title">{product.name}</h1>
              <div className="detail-price">
                {(selectedVariant?.price ?? product.price).toLocaleString()}{" "}
                <span>đ</span>
              </div>
            </header>

            {variants.length > 0 && (
              <div className="variant-box">
                <label>Phân loại hàng</label>
                <div className="chips-container">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      disabled={v.stock <= 0}
                      className={`chip ${selectedVariant?.id === v.id ? "active" : ""} ${v.stock <= 0 ? "out" : ""}`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v.variant_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="description-area">
              <label>Giới thiệu</label>
              <p>
                {product.description ||
                  "Một siêu phẩm từ Tiger Shop đang chờ bạn khám phá."}
              </p>
            </div>

            <div className="footer-actions">
              <div className="stock-info">
                {variants.length > 0 ? (
                  selectedVariant ? (
                    <p className={selectedVariant.stock > 0 ? "text-in" : "text-out"}>
                      {selectedVariant.stock > 0 ? `Sẵn sàng: ${selectedVariant.stock} món` : "Cháy hàng"}
                    </p>
                  ) : (
                    <p className="text-hint">Vui lòng chọn Phân loại</p>
                  )
                ) : (
                  <p className={product.stock > 0 ? "text-in" : "text-out"}>
                    {product.stock > 0 ? `Sẵn sàng: ${product.stock} món` : "Cháy hàng"}
                  </p>
                )}
              </div>

              <button
                className={`main-add-btn ${isOutOfStock ? "disabled" : ""}`}
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                {isOutOfStock ? "TẠM HẾT HÀNG" : "MUA NGAY"}
              </button>
            </div>
          </div>
        </div>
        <div className="review-panel mt-3 p-3">
          <h5 className="review-title">Danh gia san pham</h5>
          <p className="review-note mb-2">
            Ban chi co the danh gia sau khi da mua san pham nay.
          </p>
          <div className="d-flex align-items-center gap-2 mb-2 review-form-row">
            <select
              className="form-select"
              style={{ maxWidth: 120 }}
              value={myRating}
              onChange={(e) => setMyRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} sao
                </option>
              ))}
            </select>
            <input
              className="form-control"
              placeholder="Cam nhan cua ban..."
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              className="form-control"
              style={{ maxWidth: 220 }}
              onChange={(e) => setMyReviewImage(e.target.files?.[0] || null)}
            />
            <button className="btn btn-primary" onClick={handleSubmitReview}>
              Gui
            </button>
          </div>
          <div className="review-list">
            {reviews.length === 0 ? (
              <div className="review-empty">Chua co danh gia nao.</div>
            ) : (
              reviews.slice(0, 10).map((r) => (
                <div key={r.id} className="review-item">
                  <strong>{r.user_name}</strong> - {"⭐".repeat(Number(r.rating || 0))}
                  <div className="review-comment">
                    {r.comment || "(Khong co binh luan)"}
                  </div>
                  {r.image_url && (
                    <img
                      src={r.image_url?.startsWith('http') ? r.image_url : `http://localhost:5000/${r.image_url}`}
                      alt="review"
                      className="review-image"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
