import { useNavigate } from "react-router-dom";
import Header from "../layout/Header";
import "./Cart.css";

function Cart({ cart, setCart }) {
  const navigate = useNavigate();

  const increase = (item) => {
    setCart(
      cart.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  };

  const decrease = (item) => {
    if (item.quantity === 1) {
      setCart(cart.filter((i) => i.id !== item.id));
    } else {
      setCart(
        cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
        )
      );
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <Header />

      <div className="cart-page">
        <div className="cart-box">
          <h2 className="cart-title">🛒 Giỏ hàng</h2>

          {cart.length === 0 ? (
            <p className="empty-cart">Giỏ hàng trống</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  {/* IMAGE */}
                  <img
                    src={`http://localhost:5000/${item.image}`}
                    alt={item.name}
                    className="cart-image"
                  />

                  {/* INFO */}
                  <div className="cart-info">
                    <h4>{item.name}</h4>
                    <p>{Number(item.price).toLocaleString()} đ</p>
                  </div>

                  {/* QUANTITY */}
                  <div className="cart-quantity">
                    <button onClick={() => decrease(item)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increase(item)}>+</button>
                  </div>

                  {/* SUBTOTAL */}
                  <div className="cart-subtotal">
                    {Number(item.price * item.quantity).toLocaleString()} đ
                  </div>
                </div>
              ))}

              <div className="cart-footer">
                <button className="back-shop" onClick={() => navigate("/home")}>
                  ← Quay lại Shop
                </button>

                <div className="cart-total">
                  💰 Tổng: {Number(total).toLocaleString()} đ
                </div>

                <button
                  className="checkout-btn"
                  onClick={() => navigate("/checkout")}
                >
                  Thanh toán →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Cart;
