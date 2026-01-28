import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

/* ================= AUTH ================= */
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

/* ================= LAYOUT ================= */
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";

/* ================= CUSTOMER ================= */
import Home from "./pages/customer/Home";
import Shop from "./pages/customer/Shop";
import Orders from "./pages/customer/Orders";
import OrderDetail from "./pages/customer/OrderDetail";
import Checkout from "./pages/customer/Checkout";
import ProductDetail from "./pages/customer/ProductDetail";
import Cart from "./components/customer/Cart";
import Profile from "./pages/customer/Profile";
import Vouchers from "./pages/customer/Vouchers";

/* ================= ADMIN ================= */
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminStats from "./pages/admin/AdminStats";
import AdminChat from "./pages/admin/AdminChat";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminVouchers from "./pages/admin/AdminVouchers";
import AdminRoute from "./components/admin/AdminRoute";

/* ================= CHAT ================= */
import ChatWidget from "./components/chat/ChatWidget";

function App() {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");

  const location = useLocation();
  const path = location.pathname;

  // ❌ Ẩn chat với admin & auth
  const hideChat =
    path.startsWith("/admin") || path === "/login" || path === "/register";

  return (
    <>
      <Routes>
        {/* ================= REDIRECT ================= */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ================= AUTH ================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= CUSTOMER ================= */}
        <Route
          path="/home"
          element={
            <Layout cart={cart} onSearch={setSearch}>
              <Home cart={cart} setCart={setCart} />
            </Layout>
          }
        />

        <Route
          path="/shop"
          element={
            <Layout cart={cart} onSearch={setSearch}>
              <Shop cart={cart} setCart={setCart} keyword={search} />
            </Layout>
          }
        />

        <Route
          path="/product/:id"
          element={
            <Layout cart={cart} onSearch={setSearch}>
              <ProductDetail cart={cart} setCart={setCart} />
            </Layout>
          }
        />

        <Route
          path="/cart"
          element={
            <Layout cart={cart}>
              <Cart cart={cart} setCart={setCart} />
            </Layout>
          }
        />

        <Route
          path="/checkout"
          element={
            <Layout cart={cart}>
              <Checkout cart={cart} setCart={setCart} />
            </Layout>
          }
        />

        <Route
          path="/orders"
          element={
            <Layout cart={cart}>
              <Orders />
            </Layout>
          }
        />

        <Route
          path="/orders/:id"
          element={
            <Layout cart={cart}>
              <OrderDetail />
            </Layout>
          }
        />

        <Route
          path="/profile"
          element={
            <Layout cart={cart}>
              <Profile />
            </Layout>
          }
        />

        {/* ✅ CUSTOMER VOUCHERS (NHẬN VOUCHER) */}
        <Route
          path="/vouchers"
          element={
            <Layout cart={cart}>
              <Vouchers />
            </Layout>
          }
        />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminCategories />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/chat"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminChat />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/stats"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminStats />
              </AdminLayout>
            </AdminRoute>
          }
        />

        {/* ✅ ADMIN VOUCHERS */}
        <Route
          path="/admin/vouchers"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminVouchers />
              </AdminLayout>
            </AdminRoute>
          }
        />
      </Routes>

      {/* ================= CUSTOMER CHAT ================= */}
      {!hideChat && <ChatWidget />}
    </>
  );
}

export default App;
