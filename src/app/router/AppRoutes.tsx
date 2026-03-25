import { Routes, Route } from "react-router-dom";

import { LoginPage } from "../../features/auth/pages/login-page/login-page";
import { LivenessPage } from "../../features/auth/pages/liveness-page/liveness-page";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/liveness" element={<LivenessPage />} />
    </Routes>
  );
}