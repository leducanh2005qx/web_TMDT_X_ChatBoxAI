import ProductList from "../../components/customer/ProductList";

function Shop({ cart, setCart }) {
  return (
    <div style={{ padding: 20 }}>
      <h2>🛒 Cửa hàng</h2>

      <ProductList cart={cart} setCart={setCart} />
    </div>
  );
}

export default Shop;
