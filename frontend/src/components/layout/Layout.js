import Header from "./Header";

function Layout({ children, cart, onSearch }) {
  return (
    <>
      <Header cart={cart} cartCount={cart?.length || 0} onSearch={onSearch} />
      <main style={{ padding: "20px" }}>{children}</main>
    </>
  );
}

export default Layout;
