import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default AdminRoute;
