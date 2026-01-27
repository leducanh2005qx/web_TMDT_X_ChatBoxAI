import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, getCategories } from "../../services/api";
import { flyToCart } from "../../utils/flyToCart";
import "./Shop.css";

const VISIBLE = 3;

function Shop({ cart, setCart, keyword }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [group, setGroup] = useState("all");
  const [index, setIndex] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then((data) => setProducts(Array.isArray(data) ? data : []));
    getCategories().then((data) =>
      setCategories(Array.isArray(data) ? data : []),
    );
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [group, keyword]);

  const filtered = useMemo(() => {
    let list = products;

    if (group !== "all") {
      list = list.filter((p) => p.category === group);
    }

    const k = (keyword || "").toLowerCase();
    if (k) {
      list = list.filter((p) => p.name.toLowerCase().includes(k));
    }

    return list;
  }, [products, group, keyword]);

  const total = filtered.length;

  const prev = () => {
    if (total === 0) return;
    setIndex((i) => (i - 1 + total) % total);
  };

  const next = () => {
    if (total === 0) return;
    setIndex((i) => (i + 1) % total);
  };

  const visibleItems = useMemo(() => {
    if (total <= VISIBLE) return filtered;
    return [
      filtered[index % total],
      filtered[(index + 1) % total],
      filtered[(index + 2) % total],
    ];
  }, [filtered, index, total]);

  const addToCart = (e, p) => {
    e.stopPropagation(); // ❌ không chuyển trang
    if (!p) return;
    if (Number(p.stock) <= 0) return alert("Hết hàng ❌");

    flyToCart(p._imgRef);

    const exist = cart.find((i) => i.id === p.id);
    if (exist) {
      setCart(
        cart.map((i) =>
          i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setCart([...cart, { ...p, quantity: 1 }]);
    }
  };

  const goDetail = (id) => {
    navigate(`/product/${id}`);
  };

  return (
    <div className="shop-page">
      <h2 className="group-title">Sản phẩm</h2>

      {/* GROUP BAR */}
      <div className="group-bar">
        <button
          className={group === "all" ? "active" : ""}
          onClick={() => setGroup("all")}
        >
          Tất cả
        </button>

        {categories.map((c) => (
          <button
            key={c.id}
            className={group === c.name ? "active" : ""}
            onClick={() => setGroup(c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <p style={{ textAlign: "center" }}>Không có sản phẩm</p>
      ) : (
        <div className="carousel-wrapper">
          <button className="nav-btn" onClick={prev}>
            ‹
          </button>

          <div className="carousel-row">
            {visibleItems.map((p, i) => (
              <div
                key={p.id}
                className={`product-item ${i === 1 ? "center" : ""}`}
                onClick={() => goDetail(p.id)} // ✅ CLICK CARD → DETAIL
              >
                <img
                  src={`http://localhost:5000/${p.image}`}
                  alt={p.name}
                  ref={(el) => (p._imgRef = el)}
                />

                <h3>{p.name}</h3>

                <p className="price">{Number(p.price).toLocaleString()} đ</p>

                <p className={`stock ${Number(p.stock) <= 0 ? "out" : "in"}`}>
                  Còn lại: {p.stock}
                </p>

                <button
                  disabled={Number(p.stock) <= 0}
                  onClick={(e) => addToCart(e, p)} // ❌ KHÔNG vào detail
                >
                  {Number(p.stock) <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
                </button>
              </div>
            ))}
          </div>

          <button className="nav-btn" onClick={next}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default Shop;
