import { useTwoFactorCode } from "../../hooks/use-two-factor-code";
import styles from "./two-factor-code-form.module.css";

type TwoFactorCodeFormProps = {
  email: string;
  senha: string;
  idSessaoLiveness: string;
  onBackToLogin: () => void;
};

export function TwoFactorCodeForm({
  email,
  senha,
  idSessaoLiveness,
  onBackToLogin,
}: TwoFactorCodeFormProps) {
  const {
    codigo,
    setCodigo,
    loading,
    errorMessage,
    confirmarCodigo,
  } = useTwoFactorCode({
    email,
    senha,
    idSessaoLiveness,
  });

  return (
    <div className={styles.twoFactorCard}>
      <h2 className={styles.twoFactorTitle}>Autenticação em 2 fatores</h2>

      <p className={styles.twoFactorMessage}>
        Digite o código de 6 dígitos gerado no seu Google Authenticator para concluir o acesso.
      </p>

      <div className={styles.twoFactorInputGroup}>
        <label htmlFor="codigo2fa" className={styles.twoFactorLabel}>
          Código do autenticador
        </label>

        <input
          id="codigo2fa"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className={styles.twoFactorInput}
          maxLength={6}
        />
      </div>

      {errorMessage ? (
        <div className={styles.twoFactorError}>{errorMessage}</div>
      ) : null}

      <button
        type="button"
        className={styles.twoFactorBtnPrimary}
        onClick={confirmarCodigo}
        disabled={loading}
      >
        {loading ? "Validando..." : "Confirmar código"}
      </button>

      <button
        type="button"
        className={styles.twoFactorBtnLink}
        onClick={onBackToLogin}
        disabled={loading}
      >
        Voltar para o login
      </button>
    </div>
  );
}