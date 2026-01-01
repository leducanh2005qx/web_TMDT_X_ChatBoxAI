import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import "./ProductDetail.css";

function ProductDetail({ cart, setCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setProduct({
          ...data,
          stock: Number(data.stock),
        });
      })
      .catch(() => {
        alert("Không tải được sản phẩm");
        navigate(-1);
      });
  }, [id, navigate]);

  if (!product) {
    return (
      <>
        <Header />
        <p style={{ padding: 20 }}>Đang tải sản phẩm...</p>
      </>
    );
  }

  // ===== CART LOGIC =====
  const cartItem = cart.find((i) => i.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const increase = () => {
    if (cartItem) {
      setCart(
        cart.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const decrease = () => {
    if (!cartItem) return;

    if (cartItem.quantity === 1) {
      setCart(cart.filter((i) => i.id !== product.id));
    } else {
      setCart(
        cart.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    }
  };

  return (
    <>
      <Header />

      <div className="detail-page">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ⬅ Quay lại
        </button>

        <div className="detail-card">
          {/* IMAGE */}
          <div className="detail-image">
            <img
              src={`http://localhost:5000/${product.image}`}
              alt={product.name}
            />
          </div>

          {/* INFO */}
          <div className="detail-content">
            <h1 className="detail-title">{product.name}</h1>

            <p className="detail-price">
              {Number(product.price).toLocaleString()} đ
            </p>

            {product.stock > 0 ? (
              <span className="badge in-stock">Còn hàng</span>
            ) : (
              <span className="badge out-stock">Hết hàng</span>
            )}

            {product.description && (
              <div className="detail-desc">
                <h4>Mô tả sản phẩm</h4>
                <p>{product.description}</p>
              </div>
            )}

            {/* QUANTITY */}
            <div className="quantity-box">
              <span>Số lượng</span>

              <div className="quantity-control">
                <button onClick={decrease} disabled={!cartItem}>
                  −
                </button>
                <span>{quantity}</span>
                <button onClick={increase}>+</button>
              </div>
            </div>

            <p className="stock-text">
              Tồn kho: <b>{product.stock}</b>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProductDetail;
