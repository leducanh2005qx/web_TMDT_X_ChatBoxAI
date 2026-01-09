import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <div className="home-hero">
        <div className="hero-content">
          <h1>🛒 Cửa hàng công nghệ</h1>
          <p>Mua sắm nhanh chóng – An toàn – Giá tốt</p>

          <button className="hero-btn" onClick={() => navigate("/shop")}>
            Mua ngay
          </button>
        </div>
      </div>

      <div className="home-info">
        <div className="info-card">🚚 Giao hàng nhanh</div>
        <div className="info-card">💳 Thanh toán tiện lợi</div>
        <div className="info-card">⭐ Sản phẩm chất lượng</div>
      </div>
    </>
  );
}

export default Home;
