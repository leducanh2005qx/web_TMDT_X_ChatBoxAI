import { Navigate } from "react-router-dom";

function normalizeRole(role) {
  return String(role || "").toUpperCase();
}

function StaffRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = normalizeRole(localStorage.getItem("role"));

  if (!token || role !== "STAFF") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default StaffRoute;
