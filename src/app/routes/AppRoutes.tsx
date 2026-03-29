import { Routes, Route, Navigate } from "react-router-dom";
import { CadastroPage } from "../pages/cadastro/CadastroPage";
import LivenessPage from "../pages/Liveness/LivenessPage";
import { LoginPage } from "../pages/login/LoginPage";
import { HomePage } from "../pages/home/HomePage";
import ValidPage from "../pages/Valid/ValidPage";
import { ConfirmacaoUuidPage } from "../../components/ConfirmPasswordStep/ConfirmPasswordStep";
import { ProtectedRoute } from "../../auth/ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      {/* rotas públicas */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/liveness" element={<LivenessPage />} />
      <Route path="/valid" element={<ValidPage />} />
      <Route
        path="/confirmacao-email/:uuid"
        element={<ConfirmacaoUuidPage />}
      />

      {/* rotas privadas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}