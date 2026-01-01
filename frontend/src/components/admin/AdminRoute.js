import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!token || role !== "ADMIN") {
    return <Navigate to="/login" />;
  }

  return children;
}

export default AdminRoute;
