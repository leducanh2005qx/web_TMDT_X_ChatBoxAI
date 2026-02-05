import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, getCategories } from "../../services/api";
import "./Shop.css";

const VISIBLE = 3;
const AUTO_PLAY_TIME = 4000; // 4 giây tự xoay một lần

const THEME_CONFIG = {
  all: { class: "theme-all", title: "TIGER PREMIUM", icon: "✨" },
  "Nội thất": {
    class: "theme-furniture",
    title: "LUXURY INTERIOR",
    icon: "🛋️",
  },
  "Thời trang": { class: "theme-fashion", title: "FASHION VIBE", icon: "👠" },
  "Dồ ăn": { class: "theme-food", title: "HEALTHY FOOD", icon: "🍏" },
  Khác: { class: "theme-others", title: "SPECIAL ITEMS", icon: "🎁" },
};

function Shop({ keyword, wishlist = [], toggleWishlist }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [group, setGroup] = useState("all");
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const autoPlayRef = useRef(null);

  useEffect(() => {
    getProducts().then((data) => setProducts(Array.isArray(data) ? data : []));
    getCategories().then((data) =>
      setCategories(Array.isArray(data) ? data : []),
    );
  }, []);

  // --- LOGIC TỰ ĐỘNG XOAY ---
  const next = () => {
    if (filtered.length > 0) {
      setIndex((prevIndex) => (prevIndex + 1) % filtered.length);
    }
  };

  const prev = () => {
    if (filtered.length > 0) {
      setIndex(
        (prevIndex) => (prevIndex - 1 + filtered.length) % filtered.length,
      );
    }
  };

  useEffect(() => {
    autoPlayRef.current = next;
  });

  useEffect(() => {
    const play = () => autoPlayRef.current();
    const interval = setInterval(play, AUTO_PLAY_TIME);
    return () => clearInterval(interval); // Dọn dẹp khi unmount hoặc đổi category
  }, [group]); // Reset interval khi đổi nhóm hàng

  const filtered = useMemo(() => {
    let list = products;
    if (group !== "all") {
      list = list.filter(
        (p) => p.category === group || p.category_name === group,
      );
    }
    const k = (keyword || "").toLowerCase();
    if (k) list = list.filter((p) => p.name.toLowerCase().includes(k));
    return list;
  }, [products, group, keyword]);

  const visibleItems = useMemo(() => {
    const total = filtered.length;
    if (total === 0) return [];
    if (total <= VISIBLE) return filtered;
    return [
      filtered[index % total],
      filtered[(index + 1) % total],
      filtered[(index + 2) % total],
    ];
  }, [filtered, index]);

  const currentTheme = THEME_CONFIG[group] || THEME_CONFIG.all;

  return (
    <div className={`shop-page ${currentTheme.class}`}>
      <div className="glass-overlay"></div>

      {/* Decorative Elements */}
      <div className="floating-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <header className="shop-header-modern">
        <div className="brand-badge">
          {currentTheme.icon} {currentTheme.title}
        </div>
        <nav className="category-nav">
          <button
            className={`nav-link ${group === "all" ? "active" : ""}`}
            onClick={() => {
              setGroup("all");
              setIndex(0);
            }}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`nav-link ${group === c.name ? "active" : ""}`}
              onClick={() => {
                setGroup(c.name);
                setIndex(0);
              }}
            >
              {c.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="carousel-container">
        <button className="glass-nav-btn prev" onClick={prev}>
          ‹
        </button>

        <div className="product-stage">
          {visibleItems.map((p, i) => {
            const isFavorite = wishlist.some((fav) => fav.id === p.id);
            const totalStock =
              p.variants?.length > 0
                ? p.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)
                : Number(p.stock || 0);

            return (
              <div
                key={p.id}
                className={`p-card-premium ${i === 1 ? "focus" : "side"}`}
              >
                <div className="image-wrapper">
                  <div className="action-tags">
                    <button
                      className={`wish-circle ${isFavorite ? "liked" : ""}`}
                      onClick={() => toggleWishlist(p)}
                    >
                      {isFavorite ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <img
                    src={`http://localhost:5000/${p.image}`}
                    alt={p.name}
                    onClick={() => navigate(`/product/${p.id}`)}
                  />
                  {totalStock <= 0 && <div className="stock-tag">Sold Out</div>}
                </div>

                <div className="content-wrapper">
                  <h3 className="p-title">{p.name}</h3>
                  <div className="p-footer">
                    <span className="p-price">
                      {Number(p.price || 0).toLocaleString()} đ
                    </span>
                    <button
                      className="btn-action-main"
                      onClick={() => navigate(`/product/${p.id}`)}
                    >
                      {totalStock <= 0 ? "LIÊN HỆ" : "MUA NGAY"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="glass-nav-btn next" onClick={next}>
          ›
        </button>
      </main>

      {/* Progress Bar cho Auto-play */}
      <div className="auto-progress-bar">
        <div className="progress-fill" key={index}></div>
      </div>
    </div>
  );
}

export default Shop;
