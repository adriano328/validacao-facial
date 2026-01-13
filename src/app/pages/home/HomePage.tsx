import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="safe">
      <div className="container">
        <h1 className="titulo">Cadastro App</h1>

        <p>
          Bem-vindo ao sistema de cadastro.  
          Clique no botão abaixo para iniciar um novo cadastro.
        </p>

        <div className="containerBotao">
          <Link to="/cadastro" style={{ textDecoration: "none" }}>
            <button className="botao" type="button">
              <span className="textoBotao">Ir para Cadastro</span>
            </button>
          </Link>
           <Link to="/liveness" style={{ textDecoration: "none" }}>
            <button className="botao" type="button">
              <span className="textoBotao">Validação Facial</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
