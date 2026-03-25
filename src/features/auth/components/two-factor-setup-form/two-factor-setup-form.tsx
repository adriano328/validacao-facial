import { useTwoFactorSetup } from "../../hooks/use-two-factor-setup";
import styles from "./two-factor-setup-form.module.css";

type TwoFactorSetupFormProps = {
  qrCodeUrl: string;
  secret: string;
  email: string;
  senha: string;
  onBackToLogin: () => void;
  onSuccess: () => void;
};

export function TwoFactorSetupForm({
  qrCodeUrl,
  secret,
  email,
  senha,
  onBackToLogin,
  onSuccess,
}: TwoFactorSetupFormProps) {
  const {
    codigo,
    setCodigo,
    codigoFormatado,
    loading,
    errorMessage,
    confirmarCodigo,
    copiarSecret,
  } = useTwoFactorSetup({
    secret,
    email,
    senha,
    onSuccess,
  });

  return (
    <div className={styles.twoFactorCard}>
      <h2 className={styles.twoFactorTitle}>Configure seu autenticador</h2>

      <p className={styles.twoFactorMessage}>
        Escaneie o QR Code com Google Authenticator, Microsoft Authenticator ou
        outro app compatível.
      </p>

      <div className={styles.twoFactorQrContainer}>
        <img
          src={qrCodeUrl}
          alt="QR Code para autenticação em 2 fatores"
          className={styles.twoFactorQrImage}
        />
      </div>

      {secret ? (
        <div className={styles.twoFactorSecretBox}>
          <span className={styles.twoFactorSecretLabel}>Chave manual:</span>
          <span className={styles.twoFactorSecretValue}>{secret}</span>

          <button
            type="button"
            className={styles.twoFactorBtnSecondary}
            onClick={copiarSecret}
          >
            Copiar chave
          </button>
        </div>
      ) : null}

      <div className={styles.twoFactorInputGroup}>
        <label htmlFor="codigo2fa" className={styles.twoFactorLabel}>
          Código de 6 dígitos
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
        {loading ? "Confirmando..." : "Confirmar código"}
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