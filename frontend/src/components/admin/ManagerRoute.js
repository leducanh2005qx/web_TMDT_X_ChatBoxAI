import { Navigate } from "react-router-dom";
import { isManagementRole } from "../../utils/roleUtils";

function ManagerRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !isManagementRole(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ManagerRoute;
