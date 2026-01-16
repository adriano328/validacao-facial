// src/app/pages/login/LoginPage.tsx
import "../../../styles/globalStyles.css";
import "./styles.css";

import { FormField } from "../../../components/form/FormField";
import { useLoginForm } from "../../../features/login/useLoginForm";
import { useTwoFactor } from "../../../context/TwoFactorContext";
import { TwoFactorConfirm } from "../../../components/twoFactorConfirm/TwoFactorConfirm";
import { QrCodeModal } from "../../../components/qrCode/QrCodeModal";

export function LoginPage() {
  const {
    formLogin,
    setFormLogin,
    touchField,
    showError,
    handleLogin,
    isSubmitting,
    irCadastrar,
    qrCodeData,
    setQrCodeData,
    twoFactorStep,
    setTwoFactorStep,
  } = useLoginForm();

  const { resetTwoFactor } = useTwoFactor();

  return (
    <div className="safe">
      <div className="container">
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 className="titulo">Entrar</h1>

          <FormField label="E-mail" required error={showError("email")}>
            <input
              className="campo"
              value={formLogin.email}
              onChange={(e) => setFormLogin("email", e.target.value)}
              onBlur={() => touchField("email")}
              placeholder="seuemail@seuemail.com"
              inputMode="email"
              autoCapitalize="none"
              autoComplete="email"
            />
          </FormField>

          <FormField label="Senha" required error={showError("password")}>
            <input
              className="campo"
              type="password"
              value={formLogin.password}
              onChange={(e) => setFormLogin("password", e.target.value)}
              onBlur={() => touchField("password")}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </FormField>

          <div className="containerBotao">
            <button
              className="botao entrar"
              type="button"
              onClick={handleLogin}
              disabled={isSubmitting}
            >
              <span className="textoBotao">{isSubmitting ? "Entrando..." : "Entrar"}</span>
            </button>

            <button
              className="botao cadastrar"
              type="button"
              onClick={irCadastrar}
              disabled={isSubmitting}
            >
              <span className="textoBotao">Cadastrar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Modal QR */}
      {qrCodeData && (
        <QrCodeModal
          open={twoFactorStep === "qr"}
          qrCodeUrl={qrCodeData.qrCodeUrl}
          secret={qrCodeData.secret}
          onContinue={() => {
            // fecha QR e abre confirm
            setTwoFactorStep("confirm");
          }}
        />
      )}

      {/* ✅ Modal Confirm */}
      <TwoFactorConfirm
        open={twoFactorStep === "confirm"}
        onBack={() => {
          // volta pro QR se ainda tiver dados, senão fecha tudo
          if (qrCodeData) setTwoFactorStep("qr");
          else setTwoFactorStep("none");
        }}
        onDone={() => {
          // quando confirmar com sucesso, você pediu limpar tudo
          setQrCodeData(null);
          setTwoFactorStep("none");
          resetTwoFactor();
        }}
      />
    </div>
  );
}
