import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

/* ===== AUTH ===== */
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

/* ===== CUSTOMER ===== */
import Home from "./pages/customer/Home";
import Shop from "./pages/customer/Shop";
import Orders from "./pages/customer/Orders";
import OrderDetail from "./pages/customer/OrderDetail";
import Checkout from "./pages/customer/Checkout";
import ProductDetail from "./pages/customer/ProductDetail";
import Cart from "./components/customer/Cart";

/* ===== ADMIN ===== */
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminStats from "./pages/admin/AdminStats";
import AdminRoute from "./components/admin/AdminRoute";

/* ===== LAYOUT ===== */
import Header from "./components/layout/Header";

function App() {
  const [cart, setCart] = useState([]);
  const [keyword, setKeyword] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <>
      {/* ===== HEADER DUY NHẤT ===== */}
      <Header
        cart={cart}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onSearch={setKeyword}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* CUSTOMER */}
        <Route path="/home" element={<Home cart={cart} setCart={setCart} />} />

        <Route
          path="/shop"
          element={<Shop cart={cart} setCart={setCart} keyword={keyword} />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetail cart={cart} setCart={setCart} />}
        />

        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
        <Route
          path="/checkout"
          element={<Checkout cart={cart} setCart={setCart} />}
        />

        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />

        {/* ADMIN */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <AdminRoute>
              <AdminStats />
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
