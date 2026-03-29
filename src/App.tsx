import { AuthRedirectHandler } from "./auth/AuthRedirectHandler";
import { AppRoutes } from "./app/routes/AppRoutes";

export default function App() {
  return (
    <>
      <AuthRedirectHandler />
      <AppRoutes />
    </>
  );
}