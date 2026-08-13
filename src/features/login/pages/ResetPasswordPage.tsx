import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { resetarSenha } from "@features/auth/api/authApi";
import { BrandMark } from "@shared/ui/brand/BrandMark";
import { FormField } from "@shared/ui/form/FormField";
import { SectionHeader } from "@shared/ui/section-header/SectionHeader";
import "./PasswordResetPages.css";

type ResetStatus = "form" | "success" | "expired" | "used" | "invalid" | "error";

type ApiErrorResponse = {
  message?: string;
  mensagem?: string;
  error?: string;
};

type ResetForm = {
  novaSenha: string;
  confirmacaoSenha: string;
};

type ResetErrors = Partial<Record<keyof ResetForm, string>>;

const statusContent: Record<
  Exclude<ResetStatus, "form">,
  { title: string; description: string; icon: string; variant: "success" | "warning" | "error" }
> = {
  success: {
    title: "Senha redefinida com sucesso",
    description:
      "Sua senha foi alterada. Por segurança, a autenticação em dois fatores foi desativada. No próximo acesso será necessário configurar novamente o Google Authenticator.",
    icon: "✓",
    variant: "success",
  },
  expired: {
    title: "Link expirado",
    description:
      "Este link de redefinição de senha expirou. Solicite um novo link para continuar.",
    icon: "!",
    variant: "warning",
  },
  used: {
    title: "Link já utilizado",
    description:
      "Este link de redefinição já foi utilizado. Caso ainda precise alterar sua senha, solicite um novo link.",
    icon: "!",
    variant: "warning",
  },
  invalid: {
    title: "Link inválido",
    description: "Não foi possível validar este link de redefinição de senha.",
    icon: "!",
    variant: "error",
  },
  error: {
    title: "Não foi possível redefinir",
    description:
      "Ocorreu um erro ao redefinir sua senha. Tente novamente em instantes.",
    icon: "!",
    variant: "error",
  },
};

function normalizarMensagem(mensagem: string) {
  return mensagem
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function obterMensagemApi(data: unknown) {
  if (!data) return "";
  if (typeof data === "string") return data;

  const response = data as ApiErrorResponse;
  return response.message ?? response.mensagem ?? response.error ?? "";
}

function validarForm(form: ResetForm): ResetErrors {
  const errors: ResetErrors = {};

  if (!form.novaSenha.trim()) {
    errors.novaSenha = "Nova senha é obrigatória.";
  } else if (form.novaSenha.length < 6) {
    errors.novaSenha = "Mínimo 6 caracteres.";
  }

  if (!form.confirmacaoSenha.trim()) {
    errors.confirmacaoSenha = "Confirmação da nova senha é obrigatória.";
  } else if (form.confirmacaoSenha !== form.novaSenha) {
    errors.confirmacaoSenha = "As senhas não conferem.";
  }

  return errors;
}

function resolverErroReset(error: unknown): {
  status?: ResetStatus;
  message?: string;
} {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return { status: "error" };
  }

  if (!error.response) {
    return { status: "error" };
  }

  const status = error.response.status;
  const mensagem = obterMensagemApi(error.response.data);
  const mensagemNormalizada = normalizarMensagem(mensagem);

  if (mensagemNormalizada.includes("utilizado")) {
    return { status: "used" };
  }

  if (mensagemNormalizada.includes("expir")) {
    return { status: "expired" };
  }

  if (
    mensagemNormalizada.includes("token") &&
    (mensagemNormalizada.includes("invalid") ||
      mensagemNormalizada.includes("invalido"))
  ) {
    return { status: "invalid" };
  }

  if (status === 410) {
    return { status: "expired" };
  }

  if (status === 404) {
    return { status: "invalid" };
  }

  if (status === 400 && mensagem) {
    return { message: mensagem };
  }

  return { status: "error" };
}

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [form, setForm] = useState<ResetForm>({
    novaSenha: "",
    confirmacaoSenha: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof ResetForm, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<ResetStatus>(() =>
    token?.trim() ? "form" : "invalid"
  );
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const errors = validarForm(form);

  function showError(key: keyof ResetForm) {
    return submitAttempted || touched[key] ? errors[key] : undefined;
  }

  function setField<K extends keyof ResetForm>(key: K, value: ResetForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setServerMessage(null);
  }

  async function handleSubmit() {
    setSubmitAttempted(true);
    setServerMessage(null);

    const tokenReset = token?.trim();
    if (!tokenReset) {
      setStatus("invalid");
      return;
    }

    const nextErrors = validarForm(form);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSubmitting(true);
    try {
      await resetarSenha(
        {
          token: tokenReset,
          novaSenha: form.novaSenha,
          confirmacaoSenha: form.confirmacaoSenha,
        },
        controller.signal
      );
      setStatus("success");
    } catch (error) {
      const resolved = resolverErroReset(error);
      if (resolved.message) {
        setServerMessage(resolved.message);
      } else if (resolved.status) {
        setStatus(resolved.status);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusInfo = status === "form" ? null : statusContent[status];

  return (
    <main className="password-page">
      <div className="password-main">
        <BrandMark className="password-brand" />

        <section className="vf-card password-card">
          {statusInfo ? (
            <div className="password-status" aria-live="polite">
              <div
                className={`password-statusIcon password-statusIcon--${statusInfo.variant}`}
                aria-hidden="true"
              >
                {statusInfo.icon}
              </div>
              <h1 className="password-statusTitle">{statusInfo.title}</h1>
              <p className="password-statusMessage">{statusInfo.description}</p>
              <div className="password-actions">
                {status === "success" ? (
                  <button
                    className="vf-button vf-button--primary password-button"
                    type="button"
                    onClick={() => navigate("/login", { replace: true })}
                  >
                    Ir para o login
                  </button>
                ) : (
                  <>
                    <button
                      className="vf-button vf-button--primary password-button"
                      type="button"
                      onClick={() => navigate("/recuperar-senha", { replace: true })}
                    >
                      Solicitar novo link
                    </button>
                    <button
                      className="vf-link password-link"
                      type="button"
                      onClick={() => navigate("/login", { replace: true })}
                    >
                      Voltar para o login
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <SectionHeader
                className="password-cardHeader"
                title="Redefinir senha"
                subtitle="Informe sua nova senha para concluir a redefinição."
              />

              <form
                className="password-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSubmit();
                }}
              >
                <FormField label="Nova senha" required error={showError("novaSenha")}>
                  <input
                    className="vf-input"
                    type="password"
                    value={form.novaSenha}
                    onChange={(event) => setField("novaSenha", event.target.value)}
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, novaSenha: true }))
                    }
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </FormField>

                <FormField
                  label="Confirmar nova senha"
                  required
                  error={showError("confirmacaoSenha")}
                >
                  <input
                    className="vf-input"
                    type="password"
                    value={form.confirmacaoSenha}
                    onChange={(event) =>
                      setField("confirmacaoSenha", event.target.value)
                    }
                    onBlur={() =>
                      setTouched((prev) => ({ ...prev, confirmacaoSenha: true }))
                    }
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </FormField>

                {serverMessage ? (
                  <p className="password-errorMessage">{serverMessage}</p>
                ) : null}

                <div className="password-actions">
                  <button
                    className="vf-button vf-button--primary password-button"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
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
