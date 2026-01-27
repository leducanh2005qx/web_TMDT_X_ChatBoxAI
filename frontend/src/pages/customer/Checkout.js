import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../../services/api";
import "./Checkout.css";

function Checkout({ cart, setCart }) {
  const navigate = useNavigate();

  // ✅ lấy user từ localStorage (login sẽ lưu)
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [address, setAddress] = useState("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const expectedDateText = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString("vi-VN");
  }, []);

  const handleCreateOrder = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập trước khi thanh toán");
      navigate("/login");
      return;
    }

    if (!cart || cart.length === 0) {
      alert("Giỏ hàng trống");
      return;
    }

    if (!address.trim()) {
      alert("Vui lòng nhập địa chỉ nhận hàng");
      return;
    }

    // ✅ BẮT BUỘC: backend của bạn order_items + trừ kho theo VARIANT
    const invalid = cart.find((i) => !i.variant_id);
    if (invalid) {
      alert("Sản phẩm chưa chọn biến thể (size/màu). Vui lòng chọn lại!");
      return;
    }

    try {
      await createOrder({
        shipping_address: address, // ✅ backend bắt buộc
        items: cart.map((i) => ({
          variant_id: i.variant_id, // ✅ backend dùng để insert order_items + trừ kho
          variant_name: i.variant_name || null, // (không bắt buộc, backend ignore cũng ok)
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
      // ✅ hiện đúng lỗi backend trả về (vd: "Không đủ tồn kho cho biến thể")
      alert(err?.message || "❌ Lỗi tạo đơn");
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=Thanh toan ${total} VND`;

  return (
    <div className="checkout-wrapper">
      <div className="checkout-box">
        <h2>💳 Thanh toán</h2>

        <div className="checkout-section">
          <h3>👤 Thông tin người nhận</h3>
          <p>
            Tên: <b>{user?.name || "(chưa có)"}</b>
          </p>
          <p>
            SĐT: <b>{user?.phone || "(chưa có)"}</b>
          </p>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Địa chỉ nhận hàng
            </div>
            <textarea
              placeholder="Nhập địa chỉ nhận hàng..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <p style={{ marginTop: 10 }}>
            Ngày nhận dự kiến: <b>{expectedDateText}</b>
          </p>
        </div>

        <div className="checkout-section">
          <h3>📦 Sản phẩm</h3>
          {cart.map((item) => (
            <div key={item.cartKey || item.id} className="checkout-item">
              <img
                src={`http://localhost:5000/${item.image}`}
                alt={item.name}
                onError={(e) => (e.target.src = "/no-image.png")}
              />
              <div>
                <p>
                  <b>{item.name}</b>
                  {item.variant_name ? ` (${item.variant_name})` : ""}
                </p>
                <p>
                  {Number(item.price).toLocaleString()} đ × {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="total">
          Tổng tiền: <strong>{total.toLocaleString()} đ</strong>
        </p>

        <img src={qrUrl} alt="QR Thanh toán" className="qr-img" />

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
