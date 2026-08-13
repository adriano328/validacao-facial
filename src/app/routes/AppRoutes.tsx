import { Routes, Route, Navigate } from "react-router-dom";

import { ProtectedRoute } from "@features/auth/ui/ProtectedRoute";
import { RoleProtectedRoute } from "@features/auth/ui/RoleProtectedRoute";
import { IdentityConfirmationPage } from "@features/identity/pages/IdentityConfirmationPage";
import { ExternalCpfSearchPage } from "@features/external-query/pages/ExternalCpfSearchPage";
import { ForgotPasswordPage } from "@features/login/pages/ForgotPasswordPage";
import { LoginPage } from "@features/login/pages/LoginPage";
import { PrivilegesPage } from "@features/admin/pages/PrivilegesPage";
import { ResetPasswordPage } from "@features/login/pages/ResetPasswordPage";
import { CadastroPage } from "@features/registration/pages/CadastroPage";
import { EmailConfirmationPage } from "@features/registration/pages/EmailConfirmationPage";
import { RegistrationSubmittedPage } from "@features/registration/pages/RegistrationSubmittedPage";
import { AppLayout } from "@shared/ui/app-layout/AppLayout";
import { HomePage } from "@features/user/pages/HomePage";
import { PersonalDataPage } from "@features/user/pages/PersonalDataPage";
import { VotingBoothPage } from "@features/user/pages/VotingBoothPage";

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
        <Route path="/consulta-cpf" element={<ExternalCpfSearchPage />} />

        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/votacao/cabine" element={<VotingBoothPage />} />
          <Route path="/minha-conta/dados-pessoais" element={<PersonalDataPage />} />

          <Route
            element={
              <RoleProtectedRoute allowedRoles={["MEMBRO_CPE", "ADMIN_CPE"]} />
            }
          >
            <Route
              path="/cpe/confirmacao-identidade"
              element={<IdentityConfirmationPage />}
            />
          </Route>

          <Route
            element={<RoleProtectedRoute allowedRoles={["ADMIN_CPE"]} />}
          >
            <Route
              path="/administracao/privilegios"
              element={<PrivilegesPage />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
