import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { alerts } from "../../../lib/swal";
import { handleAxiosError } from "../../../utils/messageErro";
import "./TwoFactorSetupPage.css";

type TwoFactorSetupState = {
  qrCodeUrl?: string;
  secret?: string;
  email?: string;
  senha?: string;
};

export default function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as TwoFactorSetupState | null) ?? null;

  const qrCodeUrl = state?.qrCodeUrl ?? "";
  const secret = state?.secret ?? "";
  const email = state?.email ?? "";
  const senha = state?.senha ?? "";

  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const codigoFormatado = useMemo(() => {
    return codigo.replace(/\D/g, "").slice(0, 6);
  }, [codigo]);

  async function confirmarCodigo() {
    if (!secret || !email || !senha) {
      alerts.error({ text: "Dados inválidos para confirmar o 2FA. Faça login novamente." });
      navigate("/login");
      return;
    }

    if (codigoFormatado.length !== 6) {
      alerts.warn({ text: "Digite o código de 6 dígitos do autenticador." });
      return;
    }

    try {
      setLoading(true);

      await axios.post("/usuario/confirmar-two-factor", {
        secret,
        code: Number(codigoFormatado),
        email,
        senha,
      });

      alerts.success({ text: "Autenticação em 2 fatores confirmada com sucesso!" });
      navigate("/home");
    } catch (err) {
      const message = handleAxiosError(err);
      alerts.error({ text: message });
    } finally {
      setLoading(false);
    }
  }

  async function copiarSecret() {
    try {
      await navigator.clipboard.writeText(secret);
      alerts.success({ text: "Chave copiada com sucesso!" });
    } catch {
      alerts.error({ text: "Não foi possível copiar a chave." });
    }
  }

  if (!qrCodeUrl) {
    return (
      <div className="twofactor-wrapper">
        <div className="twofactor-card">
          <h2 className="twofactor-title">Autenticação em 2 fatores</h2>
          <p className="twofactor-message">
            QR Code não encontrado. Faça login novamente para reiniciar a configuração.
          </p>

          <button className="twofactor-btn-primary" onClick={() => navigate("/login")}>
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="twofactor-wrapper">
      <div className="twofactor-card">
        <h2 className="twofactor-title">Configure seu autenticador</h2>

        <p className="twofactor-message">
          Escaneie o QR Code com Google Authenticator, Microsoft Authenticator ou outro app compatível.
        </p>

        <div className="twofactor-qr-container">
          <img
            src={qrCodeUrl}
            alt="QR Code para autenticação em 2 fatores"
            className="twofactor-qr-image"
          />
        </div>

        {secret && (
          <div className="twofactor-secret-box">
            <span className="twofactor-secret-label">Chave manual:</span>
            <span className="twofactor-secret-value">{secret}</span>

            <button className="twofactor-btn-secondary" onClick={copiarSecret}>
              Copiar chave
            </button>
          </div>
        )}

        <div className="twofactor-input-group">
          <label htmlFor="codigo2fa" className="twofactor-label">
            Código de 6 dígitos
          </label>

          <input
            id="codigo2fa"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={codigoFormatado}
            onChange={(e) => setCodigo(e.target.value)}
            className="twofactor-input"
            maxLength={6}
          />
        </div>

        <button
          className="twofactor-btn-primary"
          onClick={confirmarCodigo}
          disabled={loading}
        >
          {loading ? "Confirmando..." : "Confirmar código"}
        </button>

        <button
          className="twofactor-btn-link"
          onClick={() => navigate("/login")}
          disabled={loading}
        >
          Voltar para o login
        </button>
      </div>
    </div>
  );
}