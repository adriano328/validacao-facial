import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthToken } from "./AuthTokenContext";

const PUBLIC_ROUTES = ["/login"];

export function AuthRedirectHandler() {
  const { token } = useAuthToken();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

    if (!token && !isPublicRoute) {
      navigate("/login", { replace: true });
    }
  }, [token, location.pathname, navigate]);

  return null;
}