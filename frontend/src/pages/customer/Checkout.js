import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createOrder, getMyVouchers } from "../../services/api";
import "./Checkout.css";

function Checkout({ cart, setCart }) {
  const navigate = useNavigate();
  const location = useLocation();

  const checkoutItems = useMemo(() => {
    const items = location.state?.checkoutItems || cart || [];
    return Array.isArray(items) ? items : [];
  }, [location.state, cart]);

  const [address, setAddress] = useState("");
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [city, setCity] = useState("");

  const subtotal = useMemo(() => {
    return checkoutItems.reduce(
      (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
      0,
    );
  }, [checkoutItems]);

  const shippingFee = useMemo(() => {
    if (!city || subtotal === 0) return 0;
    if (subtotal > 1000000) return 0;
    const rates = { "Hà Nội": 20000, "TP Hồ Chí Minh": 35000, Khác: 45000 };
    return rates[city] || rates["Khác"];
  }, [city, subtotal]);

  const finalTotal = Math.max(subtotal + shippingFee - discount, 0);

  useEffect(() => {
    getMyVouchers().then((data) =>
      setVouchers(Array.isArray(data) ? data : []),
    );
  }, []);

  const handleApplyVoucher = (id) => {
    const v = vouchers.find((x) => x.voucher_id === Number(id));
    if (!v) {
      setSelectedVoucher(null);
      setDiscount(0);
      return;
    }
    let d =
      v.type === "percent"
        ? Math.min(
            Math.floor((subtotal * Number(v.value || 0)) / 100),
            Number(v.max_discount || Infinity),
          )
        : Number(v.value || 0);
    setSelectedVoucher(v);
    setDiscount(d);
  };

  const handleCheckout = async () => {
    if (checkoutItems.length === 0)
      return alert("Không có sản phẩm để thanh toán");
    if (!address.trim() || !city)
      return alert("Vui lòng nhập địa chỉ và chọn Tỉnh/Thành phố");

    try {
      await createOrder({
        items: checkoutItems,
        total: finalTotal,
        shipping_address: `${address.trim()}, ${city}`,
        voucher_id: selectedVoucher?.voucher_id || null,
        payment_method: paymentMethod,
      });
      alert("🎉 Đặt hàng thành công!");
      const purchasedKeys = checkoutItems.map((item) => item.cartKey);
      setCart((prevCart) =>
        prevCart.filter((item) => !purchasedKeys.includes(item.cartKey)),
      );
      navigate("/orders");
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div className="checkout-premium-page">
      <div className="dynamic-blobs">
        <div className="blob b-blue"></div>
        <div className="blob b-purple"></div>
      </div>

      <div className="checkout-wrapper">
        <header className="checkout-main-header">
          <h1 className="premium-title">
            THANH TOÁN <span>PREMIUM</span>
          </h1>
          <p className="subtitle">Hoàn tất đơn hàng của bạn với Tiger Shop</p>
        </header>

        <div className="checkout-grid">
          <div className="checkout-left-panel">
            {/* Địa chỉ */}
            <section className="glass-section">
              <h3 className="section-title">📍 Thông tin nhận hàng</h3>
              <div className="form-group-premium">
                <label>Tỉnh / Thành phố</label>
                <select
                  className="premium-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="">-- Chọn khu vực tính phí ship --</option>
                  <option value="Hà Nội">Hà Nội (Ship 20k)</option>
                  <option value="TP Hồ Chí Minh">
                    TP Hồ Chí Minh (Ship 35k)
                  </option>
                  <option value="Khác">Các tỉnh thành khác (Ship 45k)</option>
                </select>
              </div>
              <div className="form-group-premium">
                <label>Địa chỉ chi tiết</label>
                <textarea
                  className="premium-input"
                  placeholder="Số nhà, tên đường, phường/xã..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </section>

            {/* Danh sách sản phẩm */}
            <section className="glass-section">
              <h3 className="section-title">
                📦 Sản phẩm của bạn ({checkoutItems.length})
              </h3>
              <div className="checkout-items-scroll">
                {checkoutItems.map((i) => (
                  <div key={i.cartKey || i.id} className="checkout-item-card">
                    <img
                      src={`http://localhost:5000/${i.image}`}
                      alt={i.name}
                      onError={(e) => (e.target.src = "/no-image.png")}
                    />
                    <div className="item-info">
                      <h4>{i.name}</h4>
                      {i.variant_name && (
                        <p className="variant-tag">{i.variant_name}</p>
                      )}
                      <p className="qty-tag">Số lượng: {i.quantity}</p>
                    </div>
                    <div className="item-price">
                      {(
                        Number(i.price || 0) * Number(i.quantity || 0)
                      ).toLocaleString()}{" "}
                      đ
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="checkout-right-panel">
            <div className="sticky-checkout-summary">
              {/* Mã giảm giá */}
              <section className="glass-section mini">
                <h3 className="section-title">🎁 Voucher giảm giá</h3>
                <select
                  className="premium-input voucher"
                  onChange={(e) => handleApplyVoucher(e.target.value)}
                  value={selectedVoucher?.voucher_id || ""}
                >
                  <option value="">Chọn mã ưu đãi</option>
                  {vouchers.map((v) => (
                    <option
                      key={v.voucher_id}
                      value={v.voucher_id}
                      disabled={subtotal < Number(v.min_order_value || 0)}
                    >
                      {v.code} (Đơn từ{" "}
                      {Number(v.min_order_value || 0).toLocaleString()}đ)
                    </option>
                  ))}
                </select>
              </section>

              {/* Thanh toán */}
              <section className="glass-section mini">
                <h3 className="section-title">💳 Hình thức thanh toán</h3>
                <div className="payment-grid">
                  <button
                    className={`pay-btn ${paymentMethod === "cod" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    COD
                  </button>
                  <button
                    className={`pay-btn ${paymentMethod === "qr" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("qr")}
                  >
                    Banking QR
                  </button>
                </div>

                {paymentMethod === "qr" && (
                  <div className="qr-reveal-box">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=TigerShop_Payment_${finalTotal}`}
                      alt="QR"
                    />
                    <p>
                      Quét để thanh toán{" "}
                      <span>{finalTotal.toLocaleString()}đ</span>
                    </p>
                  </div>
                )}
              </section>

              {/* Tổng kết tiền */}
              <section className="glass-section final-summary">
                <div className="calc-row">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="calc-row">
                  <span>Phí vận chuyển</span>
                  <span>
                    {shippingFee === 0
                      ? "Miễn phí"
                      : `+ ${shippingFee.toLocaleString()} đ`}
                  </span>
                </div>
                <div className="calc-row discount">
                  <span>Giảm giá</span>
                  <span>- {discount.toLocaleString()} đ</span>
                </div>
                <div className="total-divider"></div>
                <div className="calc-row total">
                  <span>Tổng cộng</span>
                  <span className="price">{finalTotal.toLocaleString()} đ</span>
                </div>

                <button
                  className="btn-confirm-order"
                  onClick={handleCheckout}
                  disabled={checkoutItems.length === 0}
                >
                  XÁC NHẬN ĐẶT HÀNG
                </button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
