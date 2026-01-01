import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

// ===== AUTH =====
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// ===== CUSTOMER =====
import Home from "./pages/customer/Home";
import Shop from "./pages/customer/Shop";
import Orders from "./pages/customer/Orders";
import OrderDetail from "./pages/customer/OrderDetail"; // 🔥 THÊM
import Checkout from "./pages/customer/Checkout";
import ProductDetail from "./pages/customer/ProductDetail";
import Cart from "./components/customer/Cart";

// ===== ADMIN =====
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminStats from "./pages/admin/AdminStats";
import AdminRoute from "./components/admin/AdminRoute";

function App() {
  const [cart, setCart] = useState([]);

  return (
    <Routes>
      {/* Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* CUSTOMER */}
      <Route path="/home" element={<Home cart={cart} setCart={setCart} />} />
      <Route path="/shop" element={<Shop cart={cart} setCart={setCart} />} />
      {/* CHI TIẾT SẢN PHẨM */}
      <Route
        path="/product/:id"
        element={<ProductDetail cart={cart} setCart={setCart} />}
      />
      {/* GIỎ HÀNG */}
      <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
      {/* THANH TOÁN */}
      <Route
        path="/checkout"
        element={<Checkout cart={cart} setCart={setCart} />}
      />
      {/* ĐƠN HÀNG */}
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:id" element={<OrderDetail />} /> {/* 🔥 BẮT BUỘC */}
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
  );
}

export default App;
