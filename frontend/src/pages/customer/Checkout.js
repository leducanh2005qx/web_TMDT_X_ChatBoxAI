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

  // ✅ Quản lý đồng thời 2 loại Voucher
  const [selectedVouchers, setSelectedVouchers] = useState({
    item: null, // Lưu voucher giảm giá (percent/fixed)
    shipping: null, // Lưu voucher freeship
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [city, setCity] = useState("");

  /* ================= CALCULATION LOGIC ================= */

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

  // ✅ Logic tính toán giảm giá cộng dồn
  const { itemDiscount, shippingDiscount } = useMemo(() => {
    let iDiscount = 0;
    let sDiscount = 0;

    // 1. Tính giảm giá hàng
    if (selectedVouchers.item) {
      const v = selectedVouchers.item;
      if (v.type === "percent") {
        iDiscount = Math.min(
          Math.floor((subtotal * Number(v.value || 0)) / 100),
          Number(v.max_discount || Infinity),
        );
      } else {
        iDiscount = Number(v.value || 0);
      }
    }

    // 2. Tính giảm phí ship
    if (selectedVouchers.shipping) {
      const v = selectedVouchers.shipping;
      sDiscount = Math.min(originalShippingFee, Number(v.value || 0));
    }

    return { itemDiscount: iDiscount, shippingDiscount: sDiscount };
  }, [selectedVouchers, subtotal, originalShippingFee]);

  const finalShippingFee = Math.max(originalShippingFee - shippingDiscount, 0);
  const finalSubtotal = Math.max(subtotal - itemDiscount, 0);
  const finalTotal = finalSubtotal + finalShippingFee;

  /* ================= EFFECTS & HANDLERS ================= */

  useEffect(() => {
    getMyVouchers().then((data) =>
      setVouchers(Array.isArray(data) ? data : []),
    );
  }, []);

  const handleApplyVoucher = (id) => {
    if (!id) return;
    const v = vouchers.find((x) => x.voucher_id === Number(id));
    if (!v) return;

    if (v.type === "free_ship") {
      setSelectedVouchers((prev) => ({ ...prev, shipping: v }));
    } else {
      setSelectedVouchers((prev) => ({ ...prev, item: v }));
    }
  };

  const removeVoucher = (type) => {
    setSelectedVouchers((prev) => ({ ...prev, [type]: null }));
  };

  const handleCheckout = async () => {
    if (checkoutItems.length === 0)
      return alert("Không có sản phẩm để thanh toán");
    if (!address.trim() || !city)
      return alert("Vui lòng nhập địa chỉ và chọn Tỉnh/Thành phố");

    // Lấy danh sách ID các voucher được sử dụng
    const appliedVoucherIds = [
      selectedVouchers.item?.voucher_id,
      selectedVouchers.shipping?.voucher_id,
    ].filter(Boolean);

    try {
      await createOrder({
        items: checkoutItems,
        total: finalTotal,
        shipping_address: `${address.trim()}, ${city}`,
        voucher_ids: appliedVoucherIds, // Gửi mảng ID thay vì 1 ID duy nhất
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
          <p className="subtitle">Áp dụng voucher cộng dồn ưu đãi tối đa</p>
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

            {/* Sản phẩm */}
            <section className="glass-section">
              <h3 className="section-title">
                📦 Sản phẩm ({checkoutItems.length})
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
              {/* ✅ VOUCHER SELECTION (CHỌN CỘNG DỒN) */}
              <section className="glass-section mini">
                <h3 className="section-title">🎁 Voucher ưu đãi</h3>

                {/* Hiển thị các mã đã áp dụng */}
                <div
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {selectedVouchers.item && (
                    <div
                      style={{
                        background: "#2563eb",
                        color: "white",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      🎟️ Giảm giá: {selectedVouchers.item.code}
                      <span
                        onClick={() => removeVoucher("item")}
                        style={{
                          cursor: "pointer",
                          fontWeight: "bold",
                          padding: "0 4px",
                        }}
                      >
                        ×
                      </span>
                    </div>
                  )}
                  {selectedVouchers.shipping && (
                    <div
                      style={{
                        background: "#10b981",
                        color: "white",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      🚚 Freeship: {selectedVouchers.shipping.code}
                      <span
                        onClick={() => removeVoucher("shipping")}
                        style={{
                          cursor: "pointer",
                          fontWeight: "bold",
                          padding: "0 4px",
                        }}
                      >
                        ×
                      </span>
                    </div>
                  )}
                </div>

                <select
                  className="premium-input voucher"
                  onChange={(e) => handleApplyVoucher(e.target.value)}
                  value=""
                >
                  <option value="">+ Thêm mã ưu đãi / Freeship</option>
                  {vouchers.map((v) => {
                    const isApplied =
                      selectedVouchers.item?.voucher_id === v.voucher_id ||
                      selectedVouchers.shipping?.voucher_id === v.voucher_id;
                    return (
                      <option
                        key={v.voucher_id}
                        value={v.voucher_id}
                        disabled={
                          isApplied || subtotal < Number(v.min_order_value || 0)
                        }
                      >
                        {isApplied
                          ? `[Đã áp dụng] ${v.code}`
                          : `${v.code} (${v.type === "free_ship" ? "Freeship" : "Giảm hàng"})`}
                      </option>
                    );
                  })}
                </select>
              </section>

              {/* Thanh toán */}
              <section className="glass-section mini">
                <h3 className="section-title">💳 Thanh toán</h3>
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
              </section>

              {/* Tổng kết tiền */}
              <section className="glass-section final-summary">
                <div className="calc-row">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString()} đ</span>
                </div>

                <div className="calc-row">
                  <span>Phí vận chuyển</span>
                  <div style={{ textAlign: "right" }}>
                    {shippingDiscount > 0 && (
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#60a5fa",
                          textDecoration: "line-through",
                        }}
                      >
                        {originalShippingFee.toLocaleString()} đ
                      </div>
                    )}
                    <span>
                      {finalShippingFee === 0
                        ? "Miễn phí"
                        : `${finalShippingFee.toLocaleString()} đ`}
                    </span>
                  </div>
                </div>

                {itemDiscount > 0 && (
                  <div className="calc-row discount">
                    <span>Giảm giá hàng</span>
                    <span>- {itemDiscount.toLocaleString()} đ</span>
                  </div>
                )}

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
