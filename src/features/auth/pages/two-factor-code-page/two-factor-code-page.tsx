import { useLocation, useNavigate } from "react-router-dom";
import type { TwoFactorCodeState } from "../../model/two-factor-code.types";
import styles from "./two-factor-code-page.module.css";
import { TwoFactorCodeForm } from "../../components/two-factor-code-form.tsx/two-factor-code-form";

export function TwoFactorCodePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as TwoFactorCodeState | null) ?? null;

  const email = state?.email ?? "";
  const senha = state?.senha ?? "";
  const idSessaoLiveness = state?.idSessaoLiveness ?? "";

  const isInvalidState = !email || !senha || !idSessaoLiveness;

  if (isInvalidState) {
    return (
      <div className={styles.twoFactorWrapper}>
        <div className={styles.twoFactorFallbackCard}>
          <h2 className={styles.twoFactorFallbackTitle}>
            Autenticação em 2 fatores
          </h2>

          <p className={styles.twoFactorFallbackMessage}>
            Dados inválidos para continuar a autenticação. Faça login novamente.
          </p>

          <button
            type="button"
            className={styles.twoFactorFallbackButton}
            onClick={() => navigate("/")}
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.twoFactorWrapper}>
      <TwoFactorCodeForm
        email={email}
        senha={senha}
        idSessaoLiveness={idSessaoLiveness}
        onBackToLogin={() => navigate("/")}
      />
    </div>
  );
}