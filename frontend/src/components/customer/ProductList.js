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
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
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
          i.id === product.id ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    }
  };

  return (
    <div className="product-grid">
      {products.map((p) => (
        <div className="product-card" key={p.id}>
          <div
            className="product-image"
            onClick={() => navigate(`/product/${p.id}`)}
          >
            <img src={`http://localhost:5000/${p.image}`} alt={p.name} />
          </div>

          <div className="product-info">
            <h4 onClick={() => navigate(`/product/${p.id}`)}>{p.name}</h4>

            <p className="product-price">
              {Number(p.price).toLocaleString()} đ
            </p>

            <div className="quantity-control">
              <button onClick={() => decrease(p)}>−</button>
              <span>{getQuantity(p.id)}</span>
              <button onClick={() => increase(p)}>+</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductList;
