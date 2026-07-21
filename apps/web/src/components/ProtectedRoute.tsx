import { Navigate, useLocation } from "react-router-dom";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-sportsbook-bg flex items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  if (status !== "authenticated") {
    const redirectTo = requireAdmin ? "/admin/login" : "/login";
    return (
      <Navigate
        to={`${redirectTo}?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
