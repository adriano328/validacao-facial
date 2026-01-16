// src/app/pages/login/LoginPage.tsx
import "../../../styles/globalStyles.css";
import "./styles.css";

import { FormField } from "../../../components/form/FormField";
import { useLoginForm } from "../../../features/login/useLoginForm";
import { QrCodeModal } from "../../../components/qrCode/QrCodeModal";
import { TwoFactorConfirm } from "../../../components/twoFactorConfirm/TwoFactorConfirm";

export function LoginPage() {
  const {
    formLogin,
    setFormLogin,
    touchField,
    showError,
    handleLogin,
    isSubmitting,
    irCadastrar,
    closeTwoFactorFlow,
    // 2FA flow
    qrCodeData,
    twoFactorStep,
    goTwoFactorConfirm,
    goTwoFactorQr,
  } = useLoginForm();

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

      {/* 2FA - etapa QR Code */}
      {qrCodeData && twoFactorStep === "qr" && (
        <QrCodeModal
          open
          qrCodeUrl={qrCodeData.qrCodeUrl}
          secret={qrCodeData.secret}
          onContinue={goTwoFactorConfirm}
        />
      )}

      {/* 2FA - etapa Confirmar código */}
      {qrCodeData && twoFactorStep === "confirm" && (
        <TwoFactorConfirm open onBack={goTwoFactorQr} onDone={closeTwoFactorFlow} />
      )}
    </div>
  );
}
