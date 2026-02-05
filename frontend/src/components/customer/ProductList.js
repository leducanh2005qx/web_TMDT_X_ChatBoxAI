import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../../services/api";
import "./ProductList.css";

function ProductList({ cart, setCart }) {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(Array.isArray(data) ? data : []);
    });
  }, []);

  const getQuantity = (id) => {
    const item = cart.find((i) => i.id === id);
    return item ? item.quantity : 0;
  };

  const increase = (product) => {
    // Kiểm tra tồn kho trước khi cho phép tăng
    const currentQty = getQuantity(product.id);
    if (currentQty >= product.stock) {
      alert("Đã đạt giới hạn tồn kho!");
      return;
    }

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

  const decrease = (product) => {
    const exist = cart.find((i) => i.id === product.id);
    if (!exist) return;

    if (exist.quantity === 1) {
      setCart(cart.filter((i) => i.id !== product.id));
    } else {
      setCart(
        cart.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity - 1 } : i,
        ),
      );
    }
  };

  const goDetail = (pid) => navigate(`/product/${pid}`);

  return (
    <div className="product-list-container">
      <div className="product-grid">
        {products.map((p) => {
          const qty = getQuantity(p.id);
          const isOut = p.stock <= 0;

          return (
            <div
              key={p.id}
              className={`product-card ${isOut ? "sold-out" : ""}`}
            >
              {/* IMAGE SECTION */}
              <div className="card-media" onClick={() => goDetail(p.id)}>
                <img
                  src={`http://localhost:5000/${p.image}`}
                  alt={p.name}
                  onError={(e) => (e.target.src = "/no-image.png")}
                />
                {isOut && <div className="media-overlay">Hết hàng</div>}
                {qty > 0 && <div className="qty-badge">{qty}</div>}
              </div>

              {/* INFO SECTION */}
              <div className="card-body">
                <h4 className="card-title" onClick={() => goDetail(p.id)}>
                  {p.name}
                </h4>
                <div className="card-price">
                  {Number(p.price).toLocaleString()} <small>đ</small>
                </div>

                {/* QUANTITY CONTROL */}
                <div
                  className="card-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  {qty === 0 ? (
                    <button
                      className="btn-add-initial"
                      disabled={isOut}
                      onClick={() => increase(p)}
                    >
                      {isOut ? "Tạm hết" : "Thêm vào giỏ"}
                    </button>
                  ) : (
                    <div className="qty-stepper">
                      <button onClick={() => decrease(p)}>−</button>
                      <span className="qty-val">{qty}</span>
                      <button
                        onClick={() => increase(p)}
                        disabled={qty >= p.stock}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProductList;
