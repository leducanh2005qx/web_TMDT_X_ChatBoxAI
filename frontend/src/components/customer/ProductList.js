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
    <div className="product-grid">
      {products.map((p) => (
        <div
          className="product-card"
          key={p.id}
          role="button"
          tabIndex={0}
          onClick={() => goDetail(p.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goDetail(p.id);
          }}
        >
          <div className="product-image">
            <img
              src={`http://localhost:5000/${p.image}`}
              alt={p.name}
              onError={(e) => {
                e.target.src = "/no-image.png";
              }}
            />
          </div>

          <div className="product-info">
            <h4 className="product-title">{p.name}</h4>

            <p className="product-price">
              {Number(p.price).toLocaleString()} đ
            </p>

            {/* ✅ chặn click lan lên card để không navigate */}
            <div
              className="quantity-control"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decrease(p);
                }}
              >
                −
              </button>

              <span>{getQuantity(p.id)}</span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  increase(p);
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductList;
