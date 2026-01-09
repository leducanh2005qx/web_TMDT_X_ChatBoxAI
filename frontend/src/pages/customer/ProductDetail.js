import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import { getProductById } from "../../services/api";
import "./ProductDetail.css";

function ProductDetail({ cart, setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);

        // 🔥 QUAN TRỌNG: backend trả object
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const addToCart = () => {
    const exist = cart.find((item) => item.id === product.id);

    if (exist) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  if (loading) return <p style={{ padding: 40 }}>Đang tải...</p>;
  if (!product) return <p style={{ padding: 40 }}>Không tìm thấy sản phẩm</p>;

  return (
    <>
      <Header />

      <div className="product-detail-page">
        <button className="back-btn" onClick={() => navigate("/shop")}>
          ⬅ Quay lại Shop
        </button>

        <div className="product-detail-card">
          {/* IMAGE */}
          <div className="image-box">
            <img
              src={`http://localhost:5000/${product.image}`}
              alt={product.name}
              onError={(e) => {
                e.target.src = "/no-image.png";
              }}
            />
          </div>

          {/* INFO */}
          <div className="info-box">
            <h2>{product.name}</h2>

            <p className="price">{Number(product.price).toLocaleString()} đ</p>

            <p className="stock">Tồn kho: {product.stock}</p>

            <p className="desc">
              {product.description || "Chưa có mô tả sản phẩm"}
            </p>

            <button
              className="add-cart-btn"
              disabled={product.stock === 0}
              onClick={addToCart}
            >
              {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductDetail;
