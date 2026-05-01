import { useNavigate } from "react-router-dom";
import "./EmailConfirmationPage.css";

export function RegistrationSubmittedPage() {
  const navigate = useNavigate();

  return (
    <div className="safe">
      <div className="container">
        <div className="statusBox">
          <div className="checkCircle">
            <svg
              className="checkIcon"
              viewBox="0 0 52 52"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path className="checkPath" fill="none" d="M14 27l7 7 17-17" />
            </svg>
          </div>

          <h1 className="titulo success">Cadastro enviado</h1>
          <p className="mensagem">
            Verifique seu e-mail para concluir a confirmacao do cadastro.
          </p>

          <button
            className="botao"
            type="button"
            onClick={() => navigate("/login", { replace: true })}
          >
            <span className="textoBotao">Ir para login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
