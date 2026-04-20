import { Navigate } from "react-router-dom";
import { isAuthorized } from "../../utils/roleUtils";

function StaffRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !isAuthorized(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default StaffRoute;
