import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { confirmarEmail } from "@features/registration/api/pessoaApi";
import { BrandMark } from "@shared/ui/brand/BrandMark";
import "./EmailConfirmationPage.css";

type Status = "loading" | "success" | "error";

function StatusIcon({ status }: { status: Status }) {
  if (status === "loading") {
    return <div className="confirmation-spinner" aria-hidden="true" />;
  }

  if (status === "success") {
    return (
      <div className="confirmation-stateIcon confirmation-stateIcon--success" aria-hidden="true">
        <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
          <path fill="none" d="M14 27l7 7 17-17" />
        </svg>
      </div>
    );
  }

  return (
    <div className="confirmation-stateIcon confirmation-stateIcon--error" aria-hidden="true">
      !
    </div>
  );
}

function getStatusTitle(status: Status) {
  if (status === "loading") return "Confirmando";
  if (status === "success") return "Confirmado";
  return "Não foi possível confirmar";
}

export function EmailConfirmationPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [mensagem, setMensagem] = useState(
    "Estamos processando sua identificação nos registros seguros. Por favor, aguarde."
  );

  useEffect(() => {
    async function confirmar() {
      if (!uuid) {
        setStatus("error");
        setMensagem("Código não informado na URL.");
        return;
      }

      try {
        setStatus("loading");
        setMensagem(
          "Estamos processando sua identificação nos registros seguros. Por favor, aguarde."
        );

        await confirmarEmail(uuid);

        setStatus("success");
        setMensagem("Confirmação realizada com sucesso.");
      } catch {
        setStatus("error");
        setMensagem("Não foi possível confirmar sua solicitação.");
      }
    }

    confirmar();
  }, [uuid]);

  return (
    <main className="confirmation-page">
      <BrandMark className="confirmation-brand" />

      <section className="confirmation-card" aria-live="polite">
        <StatusIcon status={status} />

        <h2 className={`confirmation-title confirmation-title--${status}`}>
          {getStatusTitle(status)}
        </h2>
        <p className="confirmation-message">{mensagem}</p>
      </section>

      <footer className="confirmation-footer">
        <span>© 2024 E-Voto. Todos os direitos reservados.</span>
        <strong>Sistema de auditoria civil independente.</strong>
      </footer>
    </main>
  );
}
