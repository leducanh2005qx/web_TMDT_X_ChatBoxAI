import { useNavigate } from "react-router-dom";
import { createOrder } from "../../services/api";
import "./Checkout.css";

function Checkout({ cart, setCart }) {
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      alert("Giỏ hàng trống");
      return;
    }

    try {
      await createOrder({
        items: cart.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          price: i.price,
        })),
        total,
      });

      alert("🎉 Đặt hàng thành công");
      setCart([]);
      navigate("/orders");
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi tạo đơn");
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Thanh toan ${total} VND`;

  return (
    <div className="checkout-wrapper">
      <div className="checkout-box">
        <h2>💳 Thanh toán</h2>

        <p className="total">
          Tổng tiền: <strong>{total.toLocaleString()} đ</strong>
        </p>

        <img src={qrUrl} alt="QR Thanh toán" />

        <button className="confirm-btn" onClick={handleCreateOrder}>
          ✅ Xác nhận đặt hàng
        </button>

        <button className="back-btn" onClick={() => navigate("/cart")}>
          ⬅ Quay lại giỏ hàng
        </button>
      </div>
    </div>
  );
}

export default Checkout;
