import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

/* ================= AUTH ================= */
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

/* ================= LAYOUT ================= */
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import ManagerLayout from "./components/layout/ManagerLayout";
import StaffLayout from "./components/layout/StaffLayout";

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
import Wishlist from "./pages/customer/Wishlist"; // ✅ Thêm trang Wishlist

/* ================= ADMIN ================= */
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminStats from "./pages/admin/AdminStats";
import AddProduct from "./components/admin/AddProduct";
import AdminRoute from "./components/admin/AdminRoute";
import ManagerRoute from "./components/admin/ManagerRoute";
import ManagerWorkspace from "./pages/manager/ManagerWorkspace";
import StaffRoute from "./components/admin/StaffRoute";
import StaffWorkspace from "./pages/staff/StaffWorkspace";
import StaffShifts from "./pages/staff/StaffShifts";
import ManagerShifts from "./pages/manager/ManagerShifts";
import ManagerVoucher from "./components/manager/ManagerVoucher";

/* ================= CHAT ================= */
import ChatWidget from "./components/chat/ChatWidget";

function App() {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [wishlist, setWishlist] = useState([]);

  const addToCart = (product, selectedVariant = null, quantity = 1) => {
    const cartKey = selectedVariant ? `variant-${selectedVariant.id}` : product.id;
    const exist = cart.find((i) => i.cartKey === cartKey);

    if (exist) {
      setCart(
        cart.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: i.quantity + quantity } : i,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          cartKey,
          product_id: product.id,
          variant_id: selectedVariant?.id || null,
          name: product.name,
          variant_name: selectedVariant?.variant_name || null,
          price: selectedVariant?.price || product.price,
          image: product.image,
          stock: selectedVariant?.stock || product.stock,
          quantity: quantity,
        },
      ]);
    }
  };

  const toggleWishlist = (product) => {
    const isExist = wishlist.find((item) => item.id === product.id);
    if (isExist) {
      setWishlist(wishlist.filter((item) => item.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  const location = useLocation();
  const path = location.pathname;

  const hideChat =
    path.startsWith("/admin") ||
    path.startsWith("/manager") ||
    path.startsWith("/staff") ||
    path === "/login" ||
    path === "/register";

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/home"
          element={
            <Layout cart={cart} onSearch={setSearch}>
              <Home
                addToCart={addToCart}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
              />
            </Layout>
          }
        />

        <Route
          path="/shop"
          element={
            <Layout cart={cart} onSearch={setSearch}>
              <Shop
                addToCart={addToCart}
                keyword={search}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
              />
            </Layout>
          }
        />

        <Route
          path="/product/:id"
          element={
            <Layout cart={cart} onSearch={setSearch}>
              <ProductDetail
                cart={cart}
                setCart={setCart}
                addToCart={addToCart}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
              />
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

        <Route
          path="/vouchers"
          element={
            <Layout cart={cart}>
              <Vouchers />
            </Layout>
          }
        />

        {/* ✅ ROUTE DANH SÁCH YÊU THÍCH */}
        <Route
          path="/wishlist"
          element={
            <Layout cart={cart}>
              <Wishlist wishlist={wishlist} toggleWishlist={toggleWishlist} />
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
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminUserManagement />
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

        <Route
          path="/admin/system-logs"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminLogs />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route path="/manager" element={<Navigate to="/manager/workspace" replace />} />
        <Route
          path="/manager/staff"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <ManagerWorkspace />
              </ManagerLayout>
            </ManagerRoute>
          }
        />

        <Route
          path="/manager/add-product"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <AddProduct />
              </ManagerLayout>
            </ManagerRoute>
          }
        />
        <Route
          path="/manager/edit-product/:id"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <AddProduct />
              </ManagerLayout>
            </ManagerRoute>
          }
        />
        <Route
          path="/manager/workspace"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <ManagerWorkspace />
              </ManagerLayout>
            </ManagerRoute>
          }
        />
        <Route
          path="/manager/orders"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <ManagerWorkspace />
              </ManagerLayout>
            </ManagerRoute>
          }
        />
        <Route
          path="/manager/inventory"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <ManagerWorkspace />
              </ManagerLayout>
            </ManagerRoute>
          }
        />
        <Route
          path="/manager/payroll"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <ManagerWorkspace />
              </ManagerLayout>
            </ManagerRoute>
          }
        />
        <Route
          path="/manager/approvals"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <ManagerWorkspace />
              </ManagerLayout>
            </ManagerRoute>
          }
        />
        <Route
          path="/manager/attendance"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <ManagerWorkspace />
              </ManagerLayout>
            </ManagerRoute>
          }
        />
        <Route
          path="/manager/shifts"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <ManagerShifts />
              </ManagerLayout>
            </ManagerRoute>
          }
        />

        <Route
          path="/manager/vouchers"
          element={
            <ManagerRoute>
              <ManagerLayout>
                <ManagerVoucher />
              </ManagerLayout>
            </ManagerRoute>
          }
        />

        <Route path="/staff" element={<Navigate to="/staff/workspace" replace />} />
        <Route
          path="/staff/workspace"
          element={
            <StaffRoute>
              <StaffLayout>
                <StaffWorkspace />
              </StaffLayout>
            </StaffRoute>
          }
        />
        <Route
          path="/staff/orders"
          element={
            <StaffRoute>
              <StaffLayout>
                <StaffWorkspace section="orders" />
              </StaffLayout>
            </StaffRoute>
          }
        />
        <Route
          path="/staff/chat"
          element={
            <StaffRoute>
              <StaffLayout>
                <StaffWorkspace section="support" />
              </StaffLayout>
            </StaffRoute>
          }
        />
        <Route
          path="/staff/attendance"
          element={
            <StaffRoute>
              <StaffLayout>
                <StaffWorkspace section="attendance" />
              </StaffLayout>
            </StaffRoute>
          }
        />
        <Route
          path="/staff/requests"
          element={
            <StaffRoute>
              <StaffLayout>
                <StaffWorkspace section="requests" />
              </StaffLayout>
            </StaffRoute>
          }
        />
        <Route
          path="/staff/shifts"
          element={
            <StaffRoute>
              <StaffLayout>
                <StaffWorkspace section="shifts" />
              </StaffLayout>
            </StaffRoute>
          }
        />
        <Route
          path="/staff/payroll"
          element={
            <StaffRoute>
              <StaffLayout>
                <StaffWorkspace section="payroll" />
              </StaffLayout>
            </StaffRoute>
          }
        />
      </Routes>

      {/* ================= CUSTOMER CHAT ================= */}
      {!hideChat && <ChatWidget />}
    </>
  );
}

export default App;
