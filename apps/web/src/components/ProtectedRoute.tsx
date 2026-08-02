import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo,
}: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (requireAuth && !isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If authenticated user tries to access login/signup, redirect them
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo || "/"} replace />;
  }

  return <>{children}</>;
}
