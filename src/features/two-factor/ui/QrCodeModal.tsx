import { alerts } from "@shared/lib/swal";
import "./QrCodeModal.css";

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
    <div className="qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-title">
      <div className="qr-backdrop" />

      <div className="qr-card">
        <div className="qr-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 10V8.2C7 5.3 9.2 3 12 3C14.8 3 17 5.3 17 8.2V10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M6.8 10H17.2C18.2 10 19 10.8 19 11.8V19.2C19 20.2 18.2 21 17.2 21H6.8C5.8 21 5 20.2 5 19.2V11.8C5 10.8 5.8 10 6.8 10Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 14.2V16.8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className="qr-title" id="qr-title">
          Ativar autenticação em duas etapas
        </h2>

        <p className="qr-text">
          Escaneie o QR Code com seu aplicativo autenticador ou use o código manual.
        </p>

        <div className="qr-qrWrap">
          <img src={qrCodeUrl} alt="QR Code do Two-Factor" className="qr-qr" />
        </div>

        <div className="qr-secret">
          <span>Código manual</span>
          <strong>{secret}</strong>
        </div>

        <button
          type="button"
          className="qr-button qr-button--secondary"
          onClick={handleCopyCode}
        >
          Copiar código manual
        </button>

        <button type="button" className="qr-button qr-button--primary" onClick={onContinue}>
          Continuar
        </button>
      </div>
    </div>
  );
}
