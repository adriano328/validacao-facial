import { AppRoutes } from "@app/routes/AppRoutes";
import { AuthRedirectHandler } from "@features/auth/ui/AuthRedirectHandler";

export default function App() {
  return (
    <>
      <AuthRedirectHandler />
      <AppRoutes />
    </>
  );
}
