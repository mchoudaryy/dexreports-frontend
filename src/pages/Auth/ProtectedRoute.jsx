import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const ProtectedRoute = ({ children }) => {
  const { token, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/90 via-purple-50/90 to-cyan-50/90">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/authentication" state={{ from: location }} replace />;
  }

  // If user is admin and trying to access user routes, redirect to admin
  // Allow superuser to access user dashboard
  /*
  if (user?.role === "admin" && !location.pathname.startsWith("/admin")) {
    return <Navigate to="/admin/users" replace />;
  }
  */
  // If user is superuser, allow access to all user dashboard routes
  // (No redirect needed)

  return children;
};

export default ProtectedRoute;
