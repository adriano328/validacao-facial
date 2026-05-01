import { alerts } from "../../lib/swal";
import "./qrCodeModal.css";

type QrCodeModalProps = {
  open: boolean;
  qrCodeUrl: string;
  secret: string;
  onContinue: () => void;
};

export function QrCodeModal({
  open,
  qrCodeUrl,
  secret,
  onContinue,
}: QrCodeModalProps) {
  if (!open) return null;

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(secret);
      alerts.success({ text: "Código copiado para a área de transferência!" });
    } catch (error) {
      console.error("Erro ao copiar código:", error);
      alerts.error({ text: "Não foi possível copiar o código." });
    }
  }

  return (
    <div className="qr-modal">
      <div className="qr-backdrop" />

      <div className="qr-card">
        <h2 className="qr-title">Ativar autenticação em duas etapas</h2>

        <p className="qr-text">
          Escaneie o QR Code abaixo com o aplicativo autenticador
          (Google Authenticator, Authy, Microsoft Authenticator).
        </p>

        <div className="qr-qrWrap">
          <img
            src={qrCodeUrl}
            alt="QR Code do Two-Factor"
            className="qr-qr"
          />
        </div>
        <div className="qr-secret">
          <span>Código manual:</span>
          <strong>{secret}</strong>
        </div>

          <button
          type="button"
          className="qr-button secondary"
          onClick={handleCopyCode}
        >
          Copiar código Manual
        </button>

        <button className="qr-button" onClick={onContinue}>
          Continuar
        </button>
      </div>
    </div>
  );
}
