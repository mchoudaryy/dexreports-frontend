import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const AdminRoute = ({ children }) => {
  const { token, loading, user } = useAuth();
  const location = useLocation();

  if (loading || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/90 via-purple-50/90 to-cyan-50/90">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/authentication" state={{ from: location }} replace />;
  }

  // Check if user has permission (superadmin, superuser or admin)
  const role = user?.role?.toLowerCase();
  if (role !== "superadmin" && role !== "superuser" && role !== "admin") {
    // If not authorized, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
