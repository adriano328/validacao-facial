import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import { consultarCpf } from "@features/external-query/api/externalCpfApi";
import type { ConsultaCpfResponse } from "@features/external-query/api/externalCpfApi";
import { FormField } from "@shared/ui/form/FormField";
import { maskCPF } from "@shared/utils/masks";
import "./ExternalCpfSearchPage.css";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9.1 15.2C12.4689 15.2 15.2 12.4689 15.2 9.1C15.2 5.73106 12.4689 3 9.1 3C5.73106 3 3 5.73106 3 9.1C3 12.4689 5.73106 15.2 9.1 15.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13.6 13.6L17 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function getStatusClass(status: string): string {
  const normalized = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-");

  return normalized || "indefinido";
}

function getRequestErrorMessage(error: unknown): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return (
      error.response?.data?.mensagem ??
      error.response?.data?.message ??
      "Nao foi possivel consultar o CPF informado."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Nao foi possivel consultar o CPF informado.";
}

export function ExternalCpfSearchPage() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ConsultaCpfResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const normalizedCpf = useMemo(() => cpf.replace(/\D/g, ""), [cpf]);

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
      setError(getRequestErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  const fields = result
    ? [
        { label: "CPF", value: maskCPF(result.cpf) },
        { label: "Data de nascimento", value: formatDate(result.dataNascimento) },
        { label: "Telefone", value: result.telefone || "-" },
        { label: "Cargo", value: formatEnumLabel(result.cargo) },
        { label: "E-mail", value: result.email || "-" },
        { label: "Mensagem", value: result.mensagem || "-" },
      ]
    : [];

  return (
    <div className="externalCpf-page">
      <main className="externalCpf-main" aria-labelledby="externalCpf-title">
        <header className="cadastro-brand">
          <div className="cadastro-brandIcon">
            <BallotIcon />
          </div>
          <h1>E-Voto</h1>
        </header>

        <section className="vf-card cadastro-card externalCpf-card">
          <div className="vf-sectionHeader cadastro-cardHeader">
            <h4 className="vf-title" id="externalCpf-title">
              Confirma&ccedil;&atilde;o de Identidade
            </h4>
            <p className="vf-text">
              Consulta e Valida&ccedil;&atilde;o de identidade de membros
            </p>
          </div>

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
              <SearchIcon />
            </button>
          </form>

          {result ? (
            <section className="externalCpf-result" aria-live="polite">
              <div className="externalCpf-photoPanel">
                <div className="externalCpf-avatar" aria-hidden="true">
                  {getInitials(result.nome)}
                </div>
                <div>
                  <div className="externalCpf-nameRow">
                    <h2>{result.nome}</h2>
                    <span
                      className={`externalCpf-status externalCpf-status--${getStatusClass(result.status)}`}
                    >
                      {formatEnumLabel(result.status)}
                    </span>
                  </div>
                  <p>{result.mensagem || "Dados retornados pela consulta de CPF."}</p>
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
                >
                  Confirmar identidade
                </button>

                <button
                  className="vf-button vf-button--secondary"
                  type="button"
                  onClick={() => navigate(-1)}
                >
                  Voltar
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
        <p>Sistema de Auditoria Civil Independente.</p>
      </footer>
    </div>
  );
}
