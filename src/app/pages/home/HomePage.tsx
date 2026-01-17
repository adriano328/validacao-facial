import { Link } from "react-router-dom";
import "./home.css";

export function HomePage() {
  return (
    <div className="safe">
      <div className="home-card">
        <h1 className="home-title">Bem-vindo ao sistema</h1>

        <p className="home-subtitle">
          Utilize as opções abaixo para iniciar um novo cadastro
          ou realizar a validação facial.
        </p>

        <div className="home-actions">
          <Link to="/cadastro" className="link">
            <button className="home-button primary" type="button">
              Novo Cadastro
            </button>
          </Link>

          <Link to="/liveness" className="link">
            <button className="home-button secondary" type="button">
              Validação Facial
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
