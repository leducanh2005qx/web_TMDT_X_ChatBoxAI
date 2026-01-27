import { useNavigate } from "react-router-dom";
import "./Cart.css";

function Cart({ cart, setCart }) {
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 🔑 dùng cartKey thay vì id
  const inc = (cartKey) => {
    setCart(
      cart.map((i) =>
        i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    );
  };

  const dec = (cartKey) => {
    setCart(
      cart
        .map((i) =>
          i.cartKey === cartKey
            ? { ...i, quantity: Math.max(1, i.quantity - 1) }
            : i,
        )
        .filter(Boolean),
    );
  };

  const remove = (cartKey) => {
    setCart(cart.filter((i) => i.cartKey !== cartKey));
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
              <div className="cart-item" key={item.cartKey}>
                <img
                  className="cart-thumb"
                  src={`http://localhost:5000/${item.image}`}
                  alt={item.name}
                />

                <div className="cart-info">
                  <div className="cart-name">
                    {item.name}
                    {item.variant_name && (
                      <span className="cart-variant">
                        {" "}
                        ({item.variant_name})
                      </span>
                    )}
                  </div>

                  <div className="cart-price">
                    {Number(item.price).toLocaleString()} đ
                  </div>
                </div>

                <div className="cart-qty">
                  <button className="qty-btn" onClick={() => dec(item.cartKey)}>
                    −
                  </button>
                  <span className="qty-num">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => inc(item.cartKey)}>
                    +
                  </button>
                </div>

                <div className="cart-subtotal">
                  {Number(item.price * item.quantity).toLocaleString()} đ
                </div>

                <button
                  className="cart-remove"
                  onClick={() => remove(item.cartKey)}
                >
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
