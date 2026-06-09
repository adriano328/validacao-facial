import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

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

type ExternalCadastroResult = {
  cpf: string;
  nome: string;
  dataNascimento: string;
  telefone: string;
  cargo: string;
  email: string;
  statusConfirmacao: "PENDENTE" | "CONFIRMADO";
  foto: string;
};

const MOCK_PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280' viewBox='0 0 280 280'%3E%3Crect width='280' height='280' rx='18' fill='%23e7e9ee'/%3E%3Ccircle cx='140' cy='104' r='48' fill='%23073c98' opacity='.9'/%3E%3Cpath d='M58 238c11-48 43-75 82-75s71 27 82 75' fill='%23073c98' opacity='.82'/%3E%3Cpath d='M0 0h280v280H0z' fill='none'/%3E%3C/svg%3E";

function buildMockResult(cpf: string): ExternalCadastroResult {
  return {
    cpf,
    nome: "Lucas Andrade Batista",
    dataNascimento: "14/03/1988",
    telefone: "(65) 99984-2042",
    cargo: "Pastor",
    email: "lucas.andrade@email.com",
    statusConfirmacao: "PENDENTE",
    foto: MOCK_PHOTO,
  };
}

const statusLabel: Record<ExternalCadastroResult["statusConfirmacao"], string> =
  {
    PENDENTE: "Pendente",
    CONFIRMADO: "Confirmado",
  };

export function ExternalCpfSearchPage() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExternalCadastroResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const normalizedCpf = useMemo(() => cpf.replace(/\D/g, ""), [cpf]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSearched(true);

    if (normalizedCpf.length !== 11) {
      setResult(null);
      setError("Informe um CPF valido para consultar.");
      return;
    }

    setError("");
    setResult(buildMockResult(maskCPF(normalizedCpf)));
  }

  const fields = result
    ? [
        { label: "CPF", value: result.cpf },
        { label: "Nome", value: result.nome },
        { label: "Data de nascimento", value: result.dataNascimento },
        { label: "Telefone", value: result.telefone },
        { label: "Cargo", value: result.cargo },
        { label: "E-mail", value: result.email },
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

            <button className="vf-button vf-button--primary" type="submit">
              <span>Pesquisar</span>
              <SearchIcon />
            </button>
          </form>

          {result ? (
            <section className="externalCpf-result" aria-live="polite">
              <div className="externalCpf-photoPanel">
                <img
                  className="externalCpf-photo"
                  src={result.foto}
                  alt={`Foto de ${result.nome}`}
                />
                <div>
                  <div className="externalCpf-nameRow">
                    <h2>{result.nome}</h2>
                    <span
                      className={`externalCpf-status externalCpf-status--${result.statusConfirmacao.toLowerCase()}`}
                    >
                      {statusLabel[result.statusConfirmacao]}
                    </span>
                  </div>
                  <p>Dados localizados no mock da consulta externa.</p>
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
              {hasSearched
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
