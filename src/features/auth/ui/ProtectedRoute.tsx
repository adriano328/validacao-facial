import { Navigate, Outlet } from "react-router-dom";
import { useAuthToken } from "./AuthTokenContext";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthToken();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}