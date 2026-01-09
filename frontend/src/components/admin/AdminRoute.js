import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ❌ Không đăng nhập hoặc không phải ADMIN
  if (!token || role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  // ✅ Đúng admin
  return children;
}

export default AdminRoute;
