import { Routes, Route, Navigate } from "react-router-dom";

import { ProtectedRoute } from "@features/auth/ui/ProtectedRoute";
import { ExternalCpfSearchPage } from "@features/external-query/pages/ExternalCpfSearchPage";
import { ForgotPasswordPage } from "@features/login/pages/ForgotPasswordPage";
import { LoginPage } from "@features/login/pages/LoginPage";
import { ResetPasswordPage } from "@features/login/pages/ResetPasswordPage";
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
      <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha/:token" element={<ResetPasswordPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/confirmacao" element={<RegistrationSubmittedPage />} />
      <Route
        path="/confirmacao-email/:uuid"
        element={<EmailConfirmationPage />}
      />

      {/* rotas privadas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/consulta-cpf" element={<ExternalCpfSearchPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
