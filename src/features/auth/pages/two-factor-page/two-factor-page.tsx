import { useLocation, useNavigate } from "react-router-dom";
import styles from "./two-factor-page.module.css";

export function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as TwoFactorPageState | null) ?? null;

  const mode = state?.mode ?? "code";
  const qrCodeUrl = state?.qrCodeUrl ?? "";
  const secret = state?.secret ?? "";
  const email = state?.email ?? "";
  const senha = state?.senha ?? "";
  const idSessaoLiveness = state?.idSessaoLiveness ?? "";

  const invalidBaseState = !email || !senha || !idSessaoLiveness;
  const invalidSetupState = mode === "setup" && (!qrCodeUrl || !secret);

  if (invalidBaseState || invalidSetupState) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.fallbackCard}>
          <h2 className={styles.fallbackTitle}>Autenticação em 2 fatores</h2>
          <p className={styles.fallbackMessage}>
            Dados inválidos para continuar a autenticação. Faça login novamente.
          </p>

          <button
            type="button"
            className={styles.fallbackButton}
            onClick={() => navigate("/")}
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <TwoFactorForm
        mode={mode}
        qrCodeUrl={qrCodeUrl}
        secret={secret}
        email={email}
        senha={senha}
        idSessaoLiveness={idSessaoLiveness}
        onBackToLogin={() => navigate("/")}
      />
    </div>
  );
}