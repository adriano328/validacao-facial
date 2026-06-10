import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthToken } from "@features/auth/model/AuthTokenContext";
import { useUserInfo } from "@features/user/model/UserInfoContext";
import "./HomePage.css";

function BrandIcon() {
  return (
    <span className="home-brandIcon" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="img">
        <path d="M12 3.2 5.5 6v5.1c0 4.1 2.7 7.9 6.5 9.2 3.8-1.3 6.5-5.1 6.5-9.2V6L12 3.2Zm0 2.4 4.4 1.9v3.6c0 3-1.7 5.8-4.4 7-2.7-1.2-4.4-4-4.4-7V7.5L12 5.6Z" />
        <path d="M10.7 13.6 8.6 11.5l-1.2 1.2 3.3 3.3 5.8-5.8-1.2-1.2-4.6 4.6Z" />
      </svg>
    </span>
  );
}

function LocationIcon() {
  return (
    <svg className="home-info-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.8a7.1 7.1 0 0 0-7.1 7.1c0 4.9 6.2 10.9 6.5 11.2l.6.6.6-.6c.3-.3 6.5-6.3 6.5-11.2A7.1 7.1 0 0 0 12 2.8Zm0 10a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8Z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg className="home-info-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a8 8 0 1 1-7.2 4.5H2.6A10 10 0 1 0 12 2v2Zm-1 3v6l5 3 .9-1.5-4.1-2.4V7H11ZM3 3v6h6V7H6.4A8 8 0 0 1 12 4V2a10 10 0 0 0-7.4 3.3V3H3Z" />
    </svg>
  );
}

function IdentityIcon() {
  return (
    <svg className="home-function-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.8C4 4.8 4.8 4 5.8 4h12.4c1 0 1.8.8 1.8 1.8v12.4c0 1-.8 1.8-1.8 1.8H5.8c-1 0-1.8-.8-1.8-1.8V5.8Zm2 .2v12h12V6H6Zm3 3.7A3 3 0 1 1 12 12.8a3 3 0 0 1-3-3.1Zm3-1.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm-4.2 7.2c.7-1.5 2.2-2.4 4.2-2.4s3.5.9 4.2 2.4l-1.6.8c-.4-.9-1.3-1.4-2.6-1.4s-2.2.5-2.6 1.4l-1.6-.8Z" />
    </svg>
  );
}

function LoadingMark() {
  return <span className="home-status-spinner" aria-hidden="true" />;
}

function AlertMark() {
  return (
    <svg className="home-alert-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 .1 0H12Zm1 14h-2v2h2v-2Zm0-10h-2v8h2V6Z" />
    </svg>
  );
}

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
  const navigate = useNavigate();
  const { clearToken } = useAuthToken();
  const { usuario, loading, error } = useUserInfo();

  const iniciais = useMemo(() => {
    if (!usuario?.nome) {
      return "U";
    }

    return obterIniciais(usuario.nome);
  }, [usuario?.nome]);

  function handleLogout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="home-page">
        <main className="home-shell">
          <div className="home-card home-card--state">
            <LoadingMark />
            <p className="home-feedback">Carregando informações do usuário...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="home-page">
        <main className="home-shell">
          <div className="home-card home-card--state">
            <AlertMark />
            <p className="home-feedback home-feedback--error">
              {error ?? "Não foi possível carregar as informações do usuário."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="home-topbar">
        <button
          className="home-logout-button"
          type="button"
          onClick={handleLogout}
          aria-label="Sair da conta"
        >
          <span>Sair</span>
        </button>
      </header>

      <main className="home-shell">
        <div className="home-brand">
          <BrandIcon />
          <strong>E-Voto</strong>
          <span>Plataforma de Voto Eletrônico COMADEMAT</span>
        </div>

        <section className="home-card">
          <span className="home-auth-badge">Autenticado</span>

          <div className="home-avatar" aria-hidden="true">
            <span>{iniciais}</span>
          </div>

          <div className="home-content">
            <h1 className="home-title">{usuario.nome}</h1>

            <div className="home-role-badge">{usuario.cargo}</div>

            <p className="home-message">
              Acesse e participe das votações oficiais da COMADEMAT.
            </p>

            <div className="home-info-list">
              <div className="home-info-item">
                <div>
                  <span className="home-info-label">Campo</span>
                  <span className="home-info-value">
                    {usuario.campoEclesiastico.nomeCampo}
                  </span>
                </div>
                <LocationIcon />
              </div>

              <div className="home-info-item">
                <div>
                  <span className="home-info-label">Último login</span>
                  <span className="home-info-value">
                    {formatarDataHora(usuario.ultimoLogin)}
                  </span>
                </div>
                <HistoryIcon />
              </div>
            </div>

            <button
              className="home-function-button"
              type="button"
              onClick={() => navigate("/consulta-cpf")}
            >
              <span className="home-function-mark">
                <IdentityIcon />
              </span>
              <span className="home-function-copy">
                <strong>Confirmação de identidade</strong>
                <span>Validar membro</span>
              </span>
              <span className="home-function-arrow" aria-hidden="true">
                →
              </span>
            </button>

            <button className="home-access-button" type="button">
              Acessar cabine de votação
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
