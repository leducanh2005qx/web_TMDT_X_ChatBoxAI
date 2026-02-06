import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createOrder, getMyVouchers } from "../../services/api";
import "./Checkout.css";

function Checkout({ cart, setCart }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Thông tin ngân hàng MB của bạn đã được cập nhật
  const MY_BANK = {
    BANK_ID: "MB",
    ACCOUNT_NO: "3616042005888",
    ACCOUNT_NAME: "LE DINH DUC ANH",
  };

  const checkoutItems = useMemo(() => {
    const items = location.state?.checkoutItems || cart || [];
    return Array.isArray(items) ? items : [];
  }, [location.state, cart]);

  const [address, setAddress] = useState("");
  const [vouchers, setVouchers] = useState([]);
  const [selectedVouchers, setSelectedVouchers] = useState({
    item: null,
    shipping: null,
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [city, setCity] = useState("");

  const subtotal = useMemo(() => {
    return checkoutItems.reduce(
      (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
      0,
    );
  }, [checkoutItems]);

  const originalShippingFee = useMemo(() => {
    if (!city || subtotal === 0) return 0;
    if (subtotal > 1000000) return 0;
    const rates = { "Hà Nội": 20000, "TP Hồ Chí Minh": 35000, Khác: 45000 };
    return rates[city] || rates["Khác"];
  }, [city, subtotal]);

  const { itemDiscount, shippingDiscount } = useMemo(() => {
    let iDiscount = 0,
      sDiscount = 0;
    if (selectedVouchers.item) {
      const v = selectedVouchers.item;
      iDiscount =
        v.type === "percent"
          ? Math.min(
              Math.floor((subtotal * Number(v.value || 0)) / 100),
              Number(v.max_discount || Infinity),
            )
          : Number(v.value || 0);
    }
    if (selectedVouchers.shipping) {
      sDiscount = Math.min(
        originalShippingFee,
        Number(selectedVouchers.shipping.value || 0),
      );
    }
    return { itemDiscount: iDiscount, shippingDiscount: sDiscount };
  }, [selectedVouchers, subtotal, originalShippingFee]);

  const finalShippingFee = Math.max(originalShippingFee - shippingDiscount, 0);
  const finalSubtotal = Math.max(subtotal - itemDiscount, 0);
  const finalTotal = finalSubtotal + finalShippingFee;

  // ✅ Tạo link QR tự động điền số tiền và nội dung chuyển khoản
  const qrCodeUrl = `https://img.vietqr.io/image/${MY_BANK.BANK_ID}-${MY_BANK.ACCOUNT_NO}-compact2.png?amount=${finalTotal}&addInfo=TigerShop%20ThanhToan&accountName=${MY_BANK.ACCOUNT_NAME}`;

  useEffect(() => {
    getMyVouchers().then((data) =>
      setVouchers(Array.isArray(data) ? data : []),
    );
  }, []);

  const handleApplyVoucher = (id) => {
    if (!id) return;
    const v = vouchers.find((x) => x.voucher_id === Number(id));
    if (v?.type === "free_ship")
      setSelectedVouchers((p) => ({ ...p, shipping: v }));
    else setSelectedVouchers((p) => ({ ...p, item: v }));
  };

  const removeVoucher = (type) =>
    setSelectedVouchers((p) => ({ ...p, [type]: null }));

  const handleCheckout = async () => {
    if (checkoutItems.length === 0)
      return alert("Không có sản phẩm để thanh toán");
    if (!address.trim() || !city)
      return alert("Vui lòng nhập địa chỉ và chọn Tỉnh/Thành phố");

    const appliedVoucherIds = [
      selectedVouchers.item?.voucher_id,
      selectedVouchers.shipping?.voucher_id,
    ].filter(Boolean);

    try {
      await createOrder({
        items: checkoutItems,
        total: finalTotal,
        shipping_address: `${address.trim()}, ${city}`,
        voucher_ids: appliedVoucherIds,
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
            THANH TOÁN <span>TIGER SHOP</span>
          </h1>
          <p className="subtitle">Hệ thống quét mã chuyển khoản nhanh 24/7</p>
        </header>

        <div className="checkout-grid">
          <div className="checkout-left-panel">
            <section className="glass-section">
              <h3 className="section-title">📍 Địa chỉ nhận hàng</h3>
              <div className="form-group-premium">
                <label>Khu vực vận chuyển</label>
                <select
                  className="premium-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="">-- Chọn Tỉnh / Thành phố --</option>
                  <option value="Hà Nội">Hà Nội (Ship 20k)</option>
                  <option value="TP Hồ Chí Minh">
                    TP Hồ Chí Minh (Ship 35k)
                  </option>
                  <option value="Khác">Các tỉnh thành khác (Ship 45k)</option>
                </select>
              </div>
              <div className="form-group-premium">
                <label>Số nhà, tên đường</label>
                <textarea
                  className="premium-input"
                  placeholder="Ví dụ: 123 Đường ABC, Phường X..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </section>

            <section className="glass-section">
              <h3 className="section-title">
                📦 Danh sách sản phẩm ({checkoutItems.length})
              </h3>
              <div className="checkout-items-scroll">
                {checkoutItems.map((i) => (
                  <div key={i.cartKey || i.id} className="checkout-item-card">
                    <img
                      src={`http://localhost:5000/${i.image}`}
                      alt={i.name}
                    />
                    <div className="item-info">
                      <h4>{i.name}</h4>
                      {i.variant_name && (
                        <p className="variant-tag">{i.variant_name}</p>
                      )}
                      <p className="qty-tag">Số lượng: {i.quantity}</p>
                    </div>
                    <div className="item-price">
                      {(Number(i.price) * Number(i.quantity)).toLocaleString()}{" "}
                      đ
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="checkout-right-panel">
            <div className="sticky-checkout-summary">
              <section className="glass-section mini">
                <h3 className="section-title">🎁 Voucher áp dụng</h3>
                <div className="v-applied-container">
                  {selectedVouchers.item && (
                    <div className="v-tag item">
                      🎟️ {selectedVouchers.item.code}{" "}
                      <span onClick={() => removeVoucher("item")}>×</span>
                    </div>
                  )}
                  {selectedVouchers.shipping && (
                    <div className="v-tag ship">
                      🚚 {selectedVouchers.shipping.code}{" "}
                      <span onClick={() => removeVoucher("shipping")}>×</span>
                    </div>
                  )}
                </div>
                <select
                  className="premium-input voucher"
                  onChange={(e) => handleApplyVoucher(e.target.value)}
                  value=""
                >
                  <option value="">+ Chọn mã giảm giá hoặc Freeship</option>
                  {vouchers.map((v) => (
                    <option
                      key={v.voucher_id}
                      value={v.voucher_id}
                      disabled={subtotal < Number(v.min_order_value || 0)}
                    >
                      {v.code} -{" "}
                      {v.type === "free_ship"
                        ? "Miễn phí vận chuyển"
                        : "Giảm giá đơn hàng"}
                    </option>
                  ))}
                </select>
              </section>

              <section className="glass-section mini payment-box">
                <h3 className="section-title">💳 Phương thức thanh toán</h3>
                <div className="payment-grid">
                  <button
                    className={`pay-btn ${paymentMethod === "cod" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    Tiền mặt (COD)
                  </button>
                  <button
                    className={`pay-btn ${paymentMethod === "qr" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("qr")}
                  >
                    Chuyển khoản QR
                  </button>
                </div>

                {paymentMethod === "qr" && (
                  <div className="qr-display-area">
                    <div className="qr-card">
                      <img src={qrCodeUrl} alt="Mã QR VietQR" />
                      <div className="scan-line"></div>
                    </div>
                    <p className="qr-hint">Quét bằng App Ngân hàng hoặc MoMo</p>
                    <div className="qr-total-amount">
                      Cần thanh toán: {finalTotal.toLocaleString()} đ
                    </div>
                  </div>
                )}
              </section>

              <section className="glass-section final-summary">
                <div className="calc-row">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="calc-row">
                  <span>Vận chuyển</span>
                  <span>
                    {finalShippingFee === 0
                      ? "Miễn phí"
                      : `${finalShippingFee.toLocaleString()} đ`}
                  </span>
                </div>
                {itemDiscount > 0 && (
                  <div className="calc-row discount">
                    <span>Giảm giá hàng</span>
                    <span>- {itemDiscount.toLocaleString()} đ</span>
                  </div>
                )}
                <div className="total-divider"></div>
                <div className="calc-row total">
                  <span>Tổng thanh toán</span>
                  <span className="price">{finalTotal.toLocaleString()} đ</span>
                </div>
                <button
                  className="btn-confirm-order"
                  onClick={handleCheckout}
                  disabled={checkoutItems.length === 0}
                >
                  HOÀN TẤT ĐẶT HÀNG
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
