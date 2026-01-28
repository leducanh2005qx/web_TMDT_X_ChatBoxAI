import { useEffect, useState } from "react";
import { createOrder, getMyVouchers } from "../../services/api";
import "./Checkout.css";

function Checkout({ cart, setCart }) {
  const [address, setAddress] = useState("");
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const finalTotal = Math.max(subtotal - discount, 0);

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

    let d = 0;
    if (v.type === "percent") {
      d = Math.floor((subtotal * v.value) / 100);
      if (v.max_discount) d = Math.min(d, v.max_discount);
    } else {
      d = v.value;
    }

    setSelectedVoucher(v);
    setDiscount(d);
  };

  const handleCheckout = async () => {
    if (!address.trim()) return alert("Nhập địa chỉ giao hàng");

    await createOrder({
      items: cart,
      total: finalTotal,
      shipping_address: address,
      voucher_id: selectedVoucher?.voucher_id || null,
    });

    alert("🎉 Đặt hàng thành công");
    setCart([]);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Thanh toan ${finalTotal}`;

  return (
    <div className="checkout-page">
      <h2>🧾 Thanh toán</h2>

      <div className="checkout-layout">
        <div className="checkout-left">
          <div className="box">
            <h3>🛒 Sản phẩm</h3>
            {cart.map((i) => (
              <div key={i.variant_id} className="checkout-item">
                <img src={i.image} alt="" />
                <div>
                  <b>{i.name}</b>
                  <div>{i.variant_name}</div>
                  <div>x{i.quantity}</div>
                </div>
                <div>{(i.price * i.quantity).toLocaleString()} đ</div>
              </div>
            ))}
          </div>

          <div className="box">
            <h3>📦 Địa chỉ</h3>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="checkout-right">
          <div className="box">
            <h3>🎁 Voucher</h3>
            <select
              onChange={(e) => handleApplyVoucher(e.target.value)}
              value={selectedVoucher?.voucher_id || ""}
            >
              <option value="">-- Không dùng --</option>
              {vouchers.map((v) => (
                <option
                  key={v.voucher_id}
                  value={v.voucher_id}
                  disabled={subtotal < v.min_order_value || v.quantity <= 0}
                >
                  {v.code}
                  {subtotal < v.min_order_value && " (chưa đủ đơn)"}
                  {v.quantity <= 0 && " (hết)"}
                </option>
              ))}
            </select>
          </div>

          <div className="box">
            <div className="row">
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString()} đ</span>
            </div>
            <div className="row discount">
              <span>Giảm voucher</span>
              <span>- {discount.toLocaleString()} đ</span>
            </div>
            <div className="row total">
              <b>Tổng thanh toán</b>
              <b>{finalTotal.toLocaleString()} đ</b>
            </div>
          </div>

          <div className="box">
            <label>
              <input
                type="radio"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              Thanh toán khi nhận hàng
            </label>

            <label>
              <input
                type="radio"
                checked={paymentMethod === "qr"}
                onChange={() => setPaymentMethod("qr")}
              />
              Thanh toán QR
            </label>

            {paymentMethod === "qr" && <img src={qrUrl} alt="QR" />}
          </div>

          <button className="checkout-btn" onClick={handleCheckout}>
            Xác nhận đặt hàng
          </button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
