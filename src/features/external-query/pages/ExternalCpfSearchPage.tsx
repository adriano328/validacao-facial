import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import {
  confirmarUsuario,
  consultarCpf,
} from "@features/external-query/api/externalCpfApi";
import type { ConsultaCpfResponse } from "@features/external-query/api/externalCpfApi";
import { alerts } from "@shared/lib/swal";
import { FormField } from "@shared/ui/form/FormField";
import { SectionHeader } from "@shared/ui/section-header/SectionHeader";
import { maskCPF } from "@shared/utils/masks";
import "./ExternalCpfSearchPage.css";

function BallotIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 21.5V25C9 26.1 9.9 27 11 27H25C26.1 27 27 26.1 27 25V21.5"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 20.5H15.8"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <path
        d="M17.6 8.6L24.4 15.4L15 24.8H8.2V18L17.6 8.6Z"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.4 10.8L22.2 17.6"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

type ApiErrorResponse = {
  mensagem?: string;
  message?: string;
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(date);
}

function formatEnumLabel(value: string): string {
  if (!value) {
    return "-";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";

  return `${first}${last}`.toUpperCase();
}

function getPhotoSrc(photo: string): string | null {
  const trimmedPhoto = photo.trim();

  if (!trimmedPhoto) {
    return null;
  }

  if (trimmedPhoto.startsWith("data:image/")) {
    return trimmedPhoto;
  }

  if (/^https?:\/\//i.test(trimmedPhoto)) {
    return trimmedPhoto;
  }

  const mimeType = trimmedPhoto.startsWith("iVBOR")
    ? "image/png"
    : trimmedPhoto.startsWith("R0lGOD")
      ? "image/gif"
      : "image/jpeg";

  return `data:${mimeType};base64,${trimmedPhoto}`;
}

function getStatusClass(status: string): string {
  const normalized = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-");

  return normalized || "indefinido";
}

function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.mensagem ??
      error.response?.data?.message ??
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function ExternalCpfSearchPage() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ConsultaCpfResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const normalizedCpf = useMemo(() => cpf.replace(/\D/g, ""), [cpf]);
  const photoSrc = result ? getPhotoSrc(result.foto) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSearched(true);

    if (normalizedCpf.length !== 11) {
      setResult(null);
      setError("Informe um CPF valido para consultar.");
      return;
    }

    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      const data = await consultarCpf(normalizedCpf);
      setResult(data);
    } catch (requestError) {
      setResult(null);
      setError(
        getRequestErrorMessage(
          requestError,
          "Nao foi possivel consultar o CPF informado."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmIdentity() {
    if (!result || isConfirming) {
      return;
    }

    const resultCpf = result.cpf.replace(/\D/g, "") || normalizedCpf;

    setIsConfirming(true);
    alerts.loading({
      title: "Confirmando identidade...",
      text: "Aguarde enquanto o usuario e confirmado.",
    });

    try {
      const data = await confirmarUsuario({ cpf: resultCpf });
      const successMessage =
        data.mensagem ?? data.message ?? "Identidade confirmada com sucesso.";

      setResult((currentResult) => {
        if (!currentResult) {
          return currentResult;
        }

        return {
          ...currentResult,
          ...data,
          status: data.status ?? "ATIVO",
          mensagem: data.mensagem ?? currentResult.mensagem,
        };
      });

      await alerts.success({
        title: "Identidade confirmada",
        text: successMessage,
      });
    } catch (requestError) {
      alerts.close();
      await alerts.error({
        title: "Nao foi possivel confirmar",
        text: getRequestErrorMessage(
          requestError,
          "Nao foi possivel confirmar a identidade do usuario."
        ),
      });
    } finally {
      alerts.close();
      setIsConfirming(false);
    }
  }

  const fields = result
    ? [
        { label: "CPF", value: maskCPF(result.cpf) },
        { label: "Data de nascimento", value: formatDate(result.dataNascimento) },
        { label: "Telefone", value: result.telefone || "-" },
        { label: "Cargo", value: formatEnumLabel(result.cargo) },
        { label: "E-mail", value: result.email || "-" },
      ]
    : [];

  return (
    <div className="externalCpf-page">
      <main className="externalCpf-main" aria-labelledby="externalCpf-title">
        <header className="externalCpf-header">
          <button
            className="externalCpf-backButton"
            type="button"
            onClick={() => navigate(-1)}
          >
            <span aria-hidden="true">←</span>
            Voltar
          </button>

          <div className="cadastro-brand externalCpf-headerBrand">
            <div className="cadastro-brandIcon">
              <BallotIcon />
            </div>
            <h1>E-Voto</h1>
          </div>

          <span className="externalCpf-headerSpacer" aria-hidden="true" />
        </header>

        <section className="vf-card cadastro-card externalCpf-card">
          <SectionHeader
            className="cadastro-cardHeader"
            id="externalCpf-title"
            title="Confirmação de Identidade"
            titleAs="h4"
            subtitle="Consulta e Validação de identidade de membros"
          />

          <form className="externalCpf-search" onSubmit={handleSubmit}>
            <FormField label="CPF" required error={error}>
              <input
                className="vf-input"
                value={cpf}
                onChange={(event) => setCpf(maskCPF(event.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </FormField>

            <button
              className="vf-button vf-button--primary"
              type="submit"
              disabled={isLoading}
            >
              <span>{isLoading ? "Pesquisando..." : "Pesquisar"}</span>
            </button>
          </form>

          {result ? (
            <section className="externalCpf-result" aria-live="polite">
              <div className="externalCpf-photoPanel">
                {photoSrc ? (
                  <img
                    className="externalCpf-photo"
                    src={photoSrc}
                    alt={`Foto de ${result.nome}`}
                  />
                ) : (
                  <div className="externalCpf-avatar" aria-hidden="true">
                    {getInitials(result.nome)}
                  </div>
                )}
                <div>
                  <div className="externalCpf-nameRow">
                    <h2>{result.nome}</h2>
                    <span
                      className={`externalCpf-status externalCpf-status--${getStatusClass(result.status)}`}
                    >
                      {formatEnumLabel(result.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="externalCpf-grid">
                {fields.map((field) => (
                  <div className="externalCpf-field" key={field.label}>
                    <span>{field.label}</span>
                    <strong>{field.value}</strong>
                  </div>
                ))}
              </div>

              <div className="externalCpf-actions">
                <button
                  className="vf-button vf-button--primary"
                  type="button"
                  onClick={handleConfirmIdentity}
                  disabled={isConfirming}
                >
                  {isConfirming ? "Confirmando..." : "Confirmar identidade"}
                </button>

              </div>
            </section>
          ) : (
            <div className="externalCpf-empty" aria-live="polite">
              {isLoading
                ? "Consultando CPF informado..."
                : hasSearched
                ? "Nenhum registro foi exibido. Ajuste o CPF para testar novamente."
                : "O resultado da consulta aparecera aqui."}
            </div>
          )}
        </section>
      </main>

      <footer className="cadastro-footer">
        <p>&copy; 2024 E-Vote. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
