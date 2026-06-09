import { Routes, Route, Navigate } from "react-router-dom";

import { ProtectedRoute } from "@features/auth/ui/ProtectedRoute";
import { ExternalCpfSearchPage } from "@features/external-query/pages/ExternalCpfSearchPage";
import AuthLivenessPage from "@features/liveness/pages/AuthLivenessPage";
import RegistrationLivenessPage from "@features/liveness/pages/RegistrationLivenessPage";
import { LoginPage } from "@features/login/pages/LoginPage";
import { CadastroPage } from "@features/registration/pages/CadastroPage";
import { EmailConfirmationPage } from "@features/registration/pages/EmailConfirmationPage";
import { RegistrationSubmittedPage } from "@features/registration/pages/RegistrationSubmittedPage";
import { HomePage } from "@features/user/pages/HomePage";

export function AppRoutes() {
  return (
    <Routes>
      {/* rotas públicas */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/consulta-cpf" element={<ExternalCpfSearchPage />} />
      <Route path="/confirmacao" element={<RegistrationSubmittedPage />} />
      <Route path="/liveness" element={<RegistrationLivenessPage />} />
      <Route path="/valid" element={<AuthLivenessPage />} />
      <Route
        path="/confirmacao-email/:uuid"
        element={<EmailConfirmationPage />}
      />

      {/* rotas privadas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
