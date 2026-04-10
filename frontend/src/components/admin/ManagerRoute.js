import { Navigate } from "react-router-dom";

function normalizeRole(role) {
  return String(role || "").toUpperCase();
}

function ManagerRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = normalizeRole(localStorage.getItem("role"));

  if (!token || role !== "MANAGER") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ManagerRoute;
