import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { solicitarResetSenha } from "@features/auth/api/authApi";
import { BrandMark } from "@shared/ui/brand/BrandMark";
import { FormField } from "@shared/ui/form/FormField";
import { SectionHeader } from "@shared/ui/section-header/SectionHeader";
import { handleAxiosError } from "@shared/utils/messageErro";
import "./PasswordResetPages.css";

const MENSAGEM_SOLICITACAO =
  "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.";

function validarEmail(email: string) {
  const valor = email.trim();

  if (!valor) return "E-mail é obrigatório.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return "E-mail inválido.";

  return undefined;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const emailError = submitAttempted || touched ? validarEmail(email) : undefined;

  async function handleSubmit() {
    setSubmitAttempted(true);
    setErro(null);

    const erroEmail = validarEmail(email);
    if (erroEmail) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSubmitting(true);
    try {
      await solicitarResetSenha({ email: email.trim() }, controller.signal);
      setEnviado(true);
    } catch (error) {
      setErro(handleAxiosError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="password-page">
      <div className="password-main">
        <BrandMark className="password-brand" />

        <section className="vf-card password-card">
          {enviado ? (
            <div className="password-status" aria-live="polite">
              <div className="password-statusIcon password-statusIcon--success" aria-hidden="true">
                ✓
              </div>
              <h1 className="password-statusTitle">Verifique seu e-mail</h1>
              <p className="password-statusMessage">{MENSAGEM_SOLICITACAO}</p>
              <div className="password-actions">
                <button
                  className="vf-button vf-button--primary password-button"
                  type="button"
                  onClick={() => navigate("/login", { replace: true })}
                >
                  Ir para o login
                </button>
              </div>
            </div>
          ) : (
            <>
              <SectionHeader
                className="password-cardHeader"
                title="Recuperar senha"
                subtitle="Informe seu e-mail para receber o link de redefinição."
              />

              <form
                className="password-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSubmit();
                }}
              >
                <FormField label="E-mail" required error={emailError}>
                  <input
                    className="vf-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="seuemail@seuemail.com"
                    inputMode="email"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </FormField>

                {erro ? <p className="password-errorMessage">{erro}</p> : null}

                <div className="password-actions">
                  <button
                    className="vf-button vf-button--primary password-button"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Enviando..."
                      : "Enviar link de redefinição"}
                  </button>

                  <button
                    className="vf-link password-link"
                    type="button"
                    onClick={() => navigate("/login")}
                    disabled={isSubmitting}
                  >
                    Voltar para o login
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
