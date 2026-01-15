import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "../pages/home/HomePage";
import { CadastroPage } from "../pages/cadastro/CadastroPage";
import LivenessPage from "../pages/Liveness/LivenessPage";
import { LoginPage } from "../pages/login/LoginPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/liveness" element={<LivenessPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
