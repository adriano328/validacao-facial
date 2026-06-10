import "./LoginPage.css";

import { FormField } from "@shared/ui/form/FormField";
import { SectionHeader } from "@shared/ui/section-header/SectionHeader";
import { BrandMark } from "@shared/ui/brand/BrandMark";
import { useLoginForm } from "@features/login/model/useLoginForm";
import { useTwoFactor } from "@features/two-factor/model/TwoFactorContext";
import { TwoFactorConfirm } from "@features/two-factor/ui/TwoFactorConfirm";
import { QrCodeModal } from "@features/two-factor/ui/QrCodeModal";

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
    <div className="login-page">
      <main className="login-main" aria-labelledby="login-title">
        <BrandMark className="login-brand" />

        <section className="vf-card login-card">
          <SectionHeader
            className="login-cardHeader"
            id="login-title"
            title="Entrar"
            subtitle="Insira suas credenciais para acessar o sistema."
          />

          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleLogin();
            }}
          >
            <FormField label="E-mail" required error={showError("email")}>
              <input
              className="vf-input"
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
              className="vf-input"
                type="password"
                value={formLogin.password}
                onChange={(e) => setFormLogin("password", e.target.value)}
                onBlur={() => touchField("password")}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </FormField>
            <div className="login-actions">
              <button
              className="vf-button vf-button--primary login-button"
                type="submit"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? "Entrando..." : "Entrar"}</span>
              </button>

              <button
              className="vf-button vf-button--secondary login-button"
                type="button"
                onClick={irCadastrar}
                disabled={isSubmitting}
              >
                <span>Cadastrar</span>
              </button>

            <button className="vf-link login-forgot" type="button">
                Esqueceu sua senha?
              </button>
            </div>
          </form>
        </section>
      </main>

      {qrCodeData && (
        <QrCodeModal
          open={twoFactorStep === "qr"}
          qrCodeUrl={qrCodeData.qrCodeUrl}
          secret={qrCodeData.secret}
          onContinue={() => {
            setTwoFactorStep("confirm");
          }}
        />
      )}

      <TwoFactorConfirm
        open={twoFactorStep === "confirm"}
        onBack={() => {
          if (qrCodeData) setTwoFactorStep("qr");
          else setTwoFactorStep("none");
        }}
        onDone={() => {
          setQrCodeData(null);
          setTwoFactorStep("none");
          resetTwoFactor();
        }}
      />
    </div>
  );
}
