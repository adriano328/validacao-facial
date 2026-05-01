import { Navigate, Outlet } from "react-router-dom";
import { useAuthToken } from "@features/auth/model/AuthTokenContext";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthToken();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
