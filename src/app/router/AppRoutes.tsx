import { Routes, Route } from "react-router-dom";

import { LoginPage } from "../../features/auth/pages/login-page/login-page";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      
    </Routes>
  );
}