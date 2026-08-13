import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthToken } from "@features/auth/model/AuthTokenContext";

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname === "/login") return true;
  if (pathname === "/cadastro") return true;
  if (pathname === "/recuperar-senha") return true;
  if (pathname.startsWith("/confirmacao-email/")) return true;
  if (pathname.startsWith("/redefinir-senha/")) return true;

  return false;
}

export function AuthRedirectHandler() {
  const { isAuthenticated } = useAuthToken();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const publicRoute = isPublicRoute(location.pathname);

    if (!isAuthenticated && !publicRoute) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return null;
}
