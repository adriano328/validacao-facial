import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useParams } from "react-router-dom";
import {
  confirmarEmail,
  type ConfirmarEmailResponse,
} from "@features/registration/api/pessoaApi";
import { BrandMark } from "@shared/ui/brand/BrandMark";
import "./EmailConfirmationPage.css";

type ConfirmationStatus =
  | "loading"
  | "success"
  | "already_confirmed"
  | "expired"
  | "invalid"
  | "error";

type VisualStatus = "loading" | "success" | "info" | "warning" | "error";

type ApiErrorResponse = {
  message?: string;
  mensagem?: string;
  error?: string;
};

const confirmationRequests = new Map<string, Promise<ConfirmarEmailResponse>>();

const statusContent: Record<
  ConfirmationStatus,
  { title: string; description: string; visualStatus: VisualStatus }
> = {
  loading: {
    title: "Confirmando seu e-mail...",
    description: "Aguarde alguns instantes.",
    visualStatus: "loading",
  },
  success: {
    title: "E-mail confirmado",
    description: "Seu endereço de e-mail foi confirmado com sucesso.",
    visualStatus: "success",
  },
  already_confirmed: {
    title: "E-mail já confirmado",
    description: "Este endereço de e-mail já foi confirmado anteriormente.",
    visualStatus: "info",
  },
  expired: {
    title: "Link expirado",
    description:
      "Este link de confirmação expirou. Solicite um novo link para continuar.",
    visualStatus: "warning",
  },
  invalid: {
    title: "Link inválido",
    description:
      "Não foi possível localizar uma confirmação válida para este link.",
    visualStatus: "error",
  },
  error: {
    title: "Não foi possível confirmar",
    description:
      "Ocorreu um erro ao confirmar seu e-mail. Tente novamente em instantes.",
    visualStatus: "error",
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

function confirmarEmailUmaVez(codigo: string) {
  const requestExistente = confirmationRequests.get(codigo);

  if (requestExistente) {
    return requestExistente;
  }

  const request = confirmarEmail(codigo);
  confirmationRequests.set(codigo, request);

  return request;
}

function resolverStatusPorMensagem(mensagem: string): ConfirmationStatus | null {
  const mensagemNormalizada = normalizarMensagem(mensagem);

  if (
    mensagemNormalizada.includes("ja") &&
    mensagemNormalizada.includes("confirmado")
  ) {
    return "already_confirmed";
  }

  if (mensagemNormalizada.includes("expir")) {
    return "expired";
  }

  if (
    mensagemNormalizada.includes("invalid") ||
    mensagemNormalizada.includes("invalido") ||
    mensagemNormalizada.includes("nao foi possivel localizar")
  ) {
    return "invalid";
  }

  if (mensagemNormalizada.includes("sucesso")) {
    return "success";
  }

  return null;
}

function resolverStatusSucesso(response: ConfirmarEmailResponse) {
  const mensagem = response.message ?? response.mensagem ?? "";
  return resolverStatusPorMensagem(mensagem) ?? "success";
}

function resolverStatusErro(error: unknown): ConfirmationStatus {
  if (!isAxiosError<ApiErrorResponse>(error)) {
    return "error";
  }

  const status = error.response?.status;
  const mensagem = obterMensagemApi(error.response?.data);
  const statusPorMensagem = resolverStatusPorMensagem(mensagem);

  if (statusPorMensagem) {
    return statusPorMensagem;
  }

  if (status === 404) {
    return "invalid";
  }

  if (status === 410) {
    return "expired";
  }

  return "error";
}

function StatusIcon({ visualStatus }: { visualStatus: VisualStatus }) {
  if (visualStatus === "loading") {
    return <div className="confirmation-spinner" aria-hidden="true" />;
  }

  if (visualStatus === "success") {
    return (
      <div className="confirmation-stateIcon confirmation-stateIcon--success" aria-hidden="true">
        <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
          <path fill="none" d="M14 27l7 7 17-17" />
        </svg>
      </div>
    );
  }

  if (visualStatus === "info") {
    return (
      <div className="confirmation-stateIcon confirmation-stateIcon--info" aria-hidden="true">
        i
      </div>
    );
  }

  if (visualStatus === "warning") {
    return (
      <div className="confirmation-stateIcon confirmation-stateIcon--warning" aria-hidden="true">
        !
      </div>
    );
  }

  return (
    <div className="confirmation-stateIcon confirmation-stateIcon--error" aria-hidden="true">
      !
    </div>
  );
}

export function EmailConfirmationPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [status, setStatus] = useState<ConfirmationStatus>("loading");

  useEffect(() => {
    const codigo = uuid?.trim();
    let ativo = true;

    if (!codigo) {
      setStatus("invalid");
      return;
    }

    const codigoConfirmacao = codigo;

    async function confirmar() {
      setStatus("loading");

      try {
        const response = await confirmarEmailUmaVez(codigoConfirmacao);
        if (ativo) {
          setStatus(resolverStatusSucesso(response));
        }
      } catch (error) {
        if (ativo) {
          setStatus(resolverStatusErro(error));
        }
      }
    }

    confirmar();

    return () => {
      ativo = false;
    };
  }, [uuid]);

  const content = statusContent[status];

  return (
    <main className="confirmation-page">
      <BrandMark className="confirmation-brand" />

      <section className="confirmation-card" aria-live="polite">
        <StatusIcon visualStatus={content.visualStatus} />

        <h2 className={`confirmation-title confirmation-title--${content.visualStatus}`}>
          {content.title}
        </h2>
        <p className="confirmation-message">{content.description}</p>
      </section>
    </main>
  );
}
