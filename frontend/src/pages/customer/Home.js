import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-premium-page">
      {/* Hệ thống nền động đồng bộ toàn trang web */}
      <div className="dynamic-blobs">
        <div className="blob hb-blue"></div>
        <div className="blob hb-purple"></div>
      </div>

      {/* SECTION 1: HERO BOX */}
      <section className="home-hero-section">
        <div className="glass-hero-card">
          <div className="hero-badge">✨ NEW ARRIVALS 2026</div>
          <h1 className="hero-main-title">
            TIGER <span>SHOP</span>
          </h1>
          <p className="hero-subtitle">
            Nâng tầm phong cách sống với những siêu phẩm công nghệ và thời trang
            hàng đầu. Mua sắm nhanh chóng – An toàn – Đẳng cấp.
          </p>

          <div className="hero-actions">
            <button
              className="btn-primary-glow"
              onClick={() => navigate("/shop")}
            >
              KHÁM PHÁ NGAY
            </button>
            <button
              className="btn-secondary-glass"
              onClick={() => navigate("/orders")}
            >
              ĐƠN HÀNG CỦA TÔI
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: SERVICE INFO */}
      <section className="home-info-grid">
        <div className="info-glass-card">
          <div className="info-icon">🚚</div>
          <div className="info-text">
            <h4>Giao hàng siêu tốc</h4>
            <p>Nhận hàng trong vòng 24h tại nội thành</p>
          </div>
        </div>

        <div className="info-glass-card">
          <div className="info-icon">💳</div>
          <div className="info-text">
            <h4>Thanh toán bảo mật</h4>
            <p>Đa dạng phương thức: QR, COD, Thẻ</p>
          </div>
        </div>

        <div className="info-glass-card">
          <div className="info-icon">🛡️</div>
          <div className="info-text">
            <h4>Cam kết chất lượng</h4>
            <p>Hoàn tiền 100% nếu sản phẩm lỗi</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
