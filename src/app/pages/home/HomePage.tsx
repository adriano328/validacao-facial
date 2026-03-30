import { useMemo } from "react";
import "./home.css";
import { useUserInfo } from "../../../context/UserInfoContext";

function formatarDataHora(dataIso: string): string {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(data);
}

function obterIniciais(nomeCompleto: string): string {
  const partes = nomeCompleto
    .trim()
    .split(" ")
    .filter((parte) => parte.length > 0);

  if (partes.length === 0) {
    return "U";
  }

  const primeira = partes[0]?.[0] ?? "";
  const ultima =
    partes.length > 1 ? partes[partes.length - 1]?.[0] ?? "" : "";

  return `${primeira}${ultima}`.toUpperCase();
}

export function HomePage() {
  const { usuario, loading, error } = useUserInfo();

  const iniciais = useMemo(() => {
    if (!usuario?.nome) {
      return "U";
    }

    return obterIniciais(usuario.nome);
  }, [usuario?.nome]);

  if (loading) {
    return (
      <div className="safe">
        <div className="home-shell">
          <div className="home-card home-card--state">
            <p className="home-feedback">Carregando informações do usuário...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="safe">
        <div className="home-shell">
          <div className="home-card home-card--state">
            <p className="home-feedback home-feedback--error">
              {error ?? "Não foi possível carregar as informações do usuário."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="safe">
      <div className="home-shell">
        <section className="home-card">
          <div className="home-avatar" aria-hidden="true">
            <span>{iniciais}</span>
          </div>

          <div className="home-content">
            <p className="home-eyebrow">Bem-vindo</p>

            <h1 className="home-title">{usuario.nome}</h1>

            <div className="home-badge">{usuario.cargo}</div>

            <p className="home-message">
              Seja bem-vindo à plataforma. Este ambiente foi preparado para
              oferecer uma experiência segura, clara e objetiva no acesso às
              suas informações.
            </p>

            <div className="home-divider" />

            <div className="home-info-list">
              <div className="home-info-item">
                <span className="home-info-label">Campo</span>
                <span className="home-info-value">
                  {usuario.campoEclesiastico.nomeCampo}
                </span>
              </div>

              <div className="home-info-item">
                <span className="home-info-label">Último login</span>
                <span className="home-info-value">
                  {formatarDataHora(usuario.ultimoLogin)}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}