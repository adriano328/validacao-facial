import "./qrCodeModal.css";

type QrCodeModalProps = {
  open: boolean;
  qrCodeUrl: string;
  secret: string;
  onClose: () => void;
};

export function QrCodeModal({
  open,
  qrCodeUrl,
  secret,
  onClose,
}: QrCodeModalProps) {
  if (!open) return null;

  return (
    <div className="qr-modal">
      <div className="qr-backdrop" onClick={onClose} />

      <div className="qr-card">
        <h2 className="qr-title">Ativar autenticação em duas etapas</h2>

        <p className="qr-text">
          Escaneie o QR Code abaixo com o aplicativo autenticador
          (Google Authenticator, Authy, Microsoft Authenticator).
        </p>

        <div className="qr-qrWrap">
          <img
            src={qrCodeUrl}
            alt="QR Code para autenticação em duas etapas"
            className="qr-qr"
          />
        </div>

        <div className="qr-secret">
          <span>Código manual:</span>
          <strong>{secret}</strong>
        </div>

        <button className="qr-button" onClick={onClose}>
          Continuar
        </button>
      </div>
    </div>
  );
}
