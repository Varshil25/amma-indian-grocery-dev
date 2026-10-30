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
    // Keep the query string too (e.g. /orders?status=DELIVERED)
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  // Signed-in user on login/signup: send them on. Right after signing in this guard re-renders
  // before the login handler navigates, so it must honour the same "return to" page.
  if (!requireAuth && isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from;
    const safeFrom = from && from.startsWith("/") && !from.startsWith("//") && !/^\/(login|signup)\b/.test(from) ? from : null;
    return <Navigate to={redirectTo || safeFrom || "/"} replace />;
  }

  return <>{children}</>;
}
