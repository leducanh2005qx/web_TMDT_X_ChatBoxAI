import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState([]);

  const toggleSelect = (cartKey) => {
    setSelectedKeys((prev) =>
      prev.includes(cartKey)
        ? prev.filter((k) => k !== cartKey)
        : [...prev, cartKey],
    );
  };

  const toggleSelectAll = () => {
    setSelectedKeys(
      selectedKeys.length === cart.length ? [] : cart.map((i) => i.cartKey),
    );
  };

  const selectedItems = cart.filter((item) =>
    selectedKeys.includes(item.cartKey),
  );
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const inc = (cartKey) => {
    setCart(
      cart.map((i) =>
        i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    );
  };

  const dec = (cartKey) => {
    setCart(
      cart.map((i) =>
        i.cartKey === cartKey
          ? { ...i, quantity: Math.max(1, i.quantity - 1) }
          : i,
      ),
    );
  };

  const remove = (cartKey) => {
    if (window.confirm("Xóa sản phẩm này khỏi giỏ hàng?")) {
      setCart(cart.filter((i) => i.cartKey !== cartKey));
      setSelectedKeys(selectedKeys.filter((k) => k !== cartKey));
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0)
      return alert("Vui lòng chọn sản phẩm để thanh toán!");
    navigate("/checkout", { state: { checkoutItems: selectedItems } });
  };

  if (cart.length === 0)
    return (
      <div className="cart-empty-page">
        <div className="empty-content">
          <div className="empty-icon">🛒</div>
          <h2>Giỏ hàng đang trống</h2>
          <p>Hãy chọn cho mình những siêu phẩm Tiger Shop nhé!</p>
          <button onClick={() => navigate("/shop")} className="btn-go-shop">
            QUAY LẠI CỬA HÀNG
          </button>
        </div>
      </div>
    );

  return (
    <div className="cart-premium-page">
      {/* Nền động đồng bộ */}
      <div className="dynamic-blobs">
        <div className="blob cb1"></div>
        <div className="blob cb2"></div>
      </div>

      <div className="cart-wrapper">
        <header className="cart-header-top">
          <h2 className="premium-title">
            GIỎ HÀNG <span>({cart.length})</span>
          </h2>
          <div className="select-all-wrapper" onClick={toggleSelectAll}>
            <div
              className={`custom-checkbox ${selectedKeys.length === cart.length ? "checked" : ""}`}
            >
              {selectedKeys.length === cart.length && "✓"}
            </div>
            <span>Chọn tất cả sản phẩm</span>
          </div>
        </header>

        <div className="cart-main-grid">
          <div className="cart-items-list">
            {cart.map((item) => (
              <div
                key={item.cartKey}
                className={`cart-premium-card ${selectedKeys.includes(item.cartKey) ? "selected" : ""}`}
              >
                <div
                  className="card-selector"
                  onClick={() => toggleSelect(item.cartKey)}
                >
                  <div
                    className={`custom-checkbox ${selectedKeys.includes(item.cartKey) ? "checked" : ""}`}
                  >
                    {selectedKeys.includes(item.cartKey) && "✓"}
                  </div>
                </div>

                <div className="item-media">
                  <img
                    src={`http://localhost:5000/${item.image}`}
                    alt={item.name}
                  />
                </div>

                <div className="item-details">
                  <h4>{item.name}</h4>
                  {item.variant_name && (
                    <span className="item-variant">{item.variant_name}</span>
                  )}
                  <p className="item-price">{item.price.toLocaleString()} đ</p>
                </div>

                <div className="item-controls">
                  <div className="premium-stepper">
                    <button onClick={() => dec(item.cartKey)}>−</button>
                    <span className="qty-val">{item.quantity}</span>
                    <button onClick={() => inc(item.cartKey)}>+</button>
                  </div>
                  <button
                    className="remove-text-btn"
                    onClick={() => remove(item.cartKey)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary-sidebar">
            <div className="glass-summary-card">
              <h3>TỔNG ĐƠN HÀNG</h3>
              <div className="summary-row">
                <span>Số lượng:</span>
                <span>{selectedKeys.length} sản phẩm</span>
              </div>
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{totalAmount.toLocaleString()} đ</span>
              </div>
              <div className="divider-dash"></div>
              <div className="summary-row total">
                <span>Tổng cộng:</span>
                <span className="total-price-final">
                  {totalAmount.toLocaleString()} đ
                </span>
              </div>
              <button className="btn-checkout-premium" onClick={handleCheckout}>
                THANH TOÁN NGAY
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Cart;
