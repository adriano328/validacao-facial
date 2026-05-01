import { useTwoFactorConfirm } from "../../features/twoFactor/useTwoConfirm";
import { FormField } from "../form/FormField";
import "./styles.css";

type TwoFactorConfirmProps = {
  open: boolean;
  onBack: () => void;
  onDone: () => void; // ✅ NOVO
};

export function TwoFactorConfirm({ open, onBack, onDone }: TwoFactorConfirmProps) {
  const {
    code,
    onChangeCode,
    onBlurCode,
    error,
    canSubmit,
    isSubmitting,
    confirm,
  } = useTwoFactorConfirm();

  if (!open) return null;

  async function handleConfirm() {
    const ok = await confirm(); // ✅ vamos ajustar o hook pra retornar boolean
    if (ok) onDone();           // ✅ limpa qrCodeData no login
  }

  return (
    <div className="qr-modal">
      <div className="qr-backdrop" />

      <div className="qr-card">
        <h1 className="titulo">Confirmar código</h1>

        <p className="twofaHint">
          Abra seu aplicativo autenticador e digite o código de 6 dígitos.
        </p>

        <FormField label="Código do Authenticator" required error={error}>
          <input
            className="campo twofaCode"
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            onBlur={onBlurCode}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
          />
        </FormField>

        <div className="twofaActions">
          <button className="botao voltar" type="button" onClick={onBack} disabled={isSubmitting}>
            <span className="textoBotao">Cancelar</span>
          </button>

          <button className="botao" type="button" onClick={handleConfirm} disabled={!canSubmit}>
            <span className="textoBotao">{isSubmitting ? "Validando..." : "Confirmar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
