import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./styles.css";
import { confirmarEmail } from "../../services/pessoa";

type Status = "loading" | "success" | "error";

export function ConfirmacaoUuidPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [mensagem, setMensagem] = useState("Confirmando solicitação...");

useEffect(() => {
  async function confirmar() {
    console.log(uuid);

    if (!uuid) {
      setStatus("error");
      setMensagem("Código não informado na URL.");
      return;
    }

    try {
      setStatus("loading");
      setMensagem("Confirmando solicitação...");

      await confirmarEmail(uuid);

      setStatus("success");
      setMensagem("Confirmação realizada com sucesso.");
    } catch (error) {
      setStatus("error");
      setMensagem("Não foi possível confirmar sua solicitação.");
    }
  }

  confirmar();
}, [uuid]);

  return (
    <div className="safe">
      <div className="container">
        {status === "loading" && (
          <div className="statusBox">
            <div className="spinner" />
            <h1 className="titulo">Confirmando</h1>
            <p className="mensagem">{mensagem}</p>
          </div>
        )}

        {status === "success" && (
          <div className="statusBox">
            <div className="checkCircle">
              <svg
                className="checkIcon"
                viewBox="0 0 52 52"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  className="checkPath"
                  fill="none"
                  d="M14 27l7 7 17-17"
                />
              </svg>
            </div>

            <h1 className="titulo success">Confirmado</h1>
            <p className="mensagem">{mensagem}</p>
          </div>
        )}

        {status === "error" && (
          <div className="statusBox">
            <div className="errorCircle">!</div>
            <h1 className="titulo error">Erro</h1>
            <p className="mensagem">{mensagem}</p>
          </div>
        )}
      </div>
    </div>
  );
}