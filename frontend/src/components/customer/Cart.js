// src/components/customer/Cart.js
import { useNavigate } from "react-router-dom";
import "./Cart.css";

function Cart({ cart, setCart }) {
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const inc = (id) => {
    setCart(
      cart.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
    );
  };

  const dec = (id) => {
    setCart(
      cart
        .map((i) =>
          i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
        )
        .filter(Boolean)
    );
  };

  const remove = (id) => {
    setCart(cart.filter((i) => i.id !== id));
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <h2 className="cart-title">🛒 Giỏ hàng</h2>
          <div className="cart-empty">
            <p>Giỏ hàng trống</p>
            <button className="cart-primary" onClick={() => navigate("/shop")}>
              Đi mua sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h2 className="cart-title">🛒 Giỏ hàng</h2>

        <div className="cart-layout">
          {/* LEFT: ITEMS */}
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img
                  className="cart-thumb"
                  src={`http://localhost:5000/${item.image}`}
                  alt={item.name}
                />

                <div className="cart-info">
                  <div className="cart-name">{item.name}</div>
                  <div className="cart-price">
                    {Number(item.price).toLocaleString()} đ
                  </div>
                </div>

                <div className="cart-qty">
                  <button className="qty-btn" onClick={() => dec(item.id)}>
                    −
                  </button>
                  <span className="qty-num">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => inc(item.id)}>
                    +
                  </button>
                </div>

                <div className="cart-subtotal">
                  {Number(item.price * item.quantity).toLocaleString()} đ
                </div>

                <button className="cart-remove" onClick={() => remove(item.id)}>
                  ✖
                </button>
              </div>
            ))}
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="cart-summary">
            <div className="summary-row">
              <span>Tạm tính</span>
              <b>{Number(total).toLocaleString()} đ</b>
            </div>

            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <b>0 đ</b>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Tổng tiền</span>
              <b>{Number(total).toLocaleString()} đ</b>
            </div>

            <button
              className="cart-primary"
              onClick={() => navigate("/checkout")}
            >
              Thanh toán
            </button>

            <button
              className="cart-secondary"
              onClick={() => navigate("/shop")}
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
