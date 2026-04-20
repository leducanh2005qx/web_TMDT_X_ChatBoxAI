import { useNavigate } from "react-router-dom";
import "./Wishlist.css";

function Wishlist({ wishlist = [], toggleWishlist }) {
  const navigate = useNavigate();

  if (wishlist.length === 0) {
    return (
      <div className="wishlist-premium-page empty">
        <div className="dynamic-blobs">
          <div className="blob wb-blue"></div>
          <div className="blob wb-purple"></div>
        </div>
        <div className="empty-wishlist-glass">
          <div className="empty-heart-anim">💖</div>
          <h2>Danh sách yêu thích trống</h2>
          <p>
            Hãy thả tim những sản phẩm bạn quan tâm để dễ dàng sở hữu chúng sau
            này nhé!
          </p>
          <button
            className="btn-back-to-shop"
            onClick={() => navigate("/shop")}
          >
            KHÁM PHÁ CỬA HÀNG
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-premium-page">
      {/* Nền động đồng bộ hệ thống */}
      <div className="dynamic-blobs">
        <div className="blob wb-blue"></div>
        <div className="blob wb-purple"></div>
      </div>

      <div className="wishlist-wrapper">
        <header className="wishlist-header-modern">
          <h2 className="premium-title">
            SẢN PHẨM <span>YÊU THÍCH</span>
          </h2>
          <div className="wishlist-count-badge">
            Bạn đang lưu trữ <b>{wishlist.length}</b> siêu phẩm
          </div>
        </header>

        <div className="wishlist-grid-premium">
          {wishlist.map((p) => {
            const isOutOfStock = Number(p.stock) <= 0;
            return (
              <div key={p.id} className="wishlist-card-glass">
                <div className="wishlist-media">
                  <button
                    className="remove-wish-icon"
                    onClick={() => toggleWishlist(p)}
                    title="Bỏ yêu thích"
                  >
                    ❤️
                  </button>
                  <img
                    src={p.image?.startsWith('http') ? p.image : `http://localhost:5000/${p.image}`}
                    alt={p.name}
                    onClick={() => navigate(`/product/${p.id}`)}
                    onError={(e) => (e.target.src = "/no-image.png")}
                  />
                  {isOutOfStock && (
                    <div className="wishlist-stock-tag">HẾT HÀNG</div>
                  )}
                </div>

                <div className="wishlist-content">
                  <h3
                    className="p-name-wish"
                    onClick={() => navigate(`/product/${p.id}`)}
                  >
                    {p.name}
                  </h3>
                  <p className="p-price-wish">
                    {Number(p.price).toLocaleString()} <span>đ</span>
                  </p>

                  <div className="wishlist-actions-footer">
                    <button
                      className="btn-wish-action"
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      {isOutOfStock ? "XEM CHI TIẾT" : "MUA NGAY"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Wishlist;
