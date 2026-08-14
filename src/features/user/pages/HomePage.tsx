import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserInfo } from "@features/user/model/UserInfoContext";
import {
  canAccessIdentity,
  canManagePrivileges,
} from "@features/user/model/permissions";
import "./HomePage.css";

type QuickAccessIcon = "vote" | "user" | "fingerprint" | "shield";

function QuickIcon({ name }: { name: QuickAccessIcon }) {
  const paths: Record<QuickAccessIcon, string> = {
    vote: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v12h12V6H6Zm2 2h4v2H8V8Zm0 4h8v2H8v-2Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4.6V20h14v-1.4C19 16 16 14 12 14Z",
    fingerprint: "M12 3c3.4 0 6 2.3 6 5.5h-2C16 6.4 14.3 5 12 5S8 6.4 8 8.5c0 1.2-.2 2.7-.8 4.5l-1.9-.6c.5-1.6.7-2.9.7-3.9C6 5.3 8.6 3 12 3Zm0 4c1.3 0 2 .7 2 1.7 0 3.8-1.2 6.8-3.8 9.6l-1.5-1.3c2.3-2.5 3.3-5 3.3-8.3 0-.1 0-.1-.1-.1-.9 0-1.4.5-1.4 1.4 0 2.4-.8 5-2.1 7.1l-1.7-1c1.1-1.8 1.8-4 1.8-6.1C8.5 8.2 9.9 7 12 7Zm4 2h2c0 4.6-1.4 8-4.3 11l-1.4-1.4C14.8 16 16 13.1 16 9Zm4 .3h2c-.1 4.5-1.6 8.3-4.3 11.2l-1.5-1.4c2.4-2.6 3.7-5.9 3.8-9.8Z",
    shield: "M12 3 5 6v5c0 4.4 2.8 8.3 7 9.8 4.2-1.5 7-5.4 7-9.8V6l-7-3Zm0 2.2 5 2.1V11c0 3.2-1.9 6.2-5 7.5-3.1-1.3-5-4.3-5-7.5V7.3l5-2.1Zm-1 8.5-2-2-1.4 1.4L11 16.5l5.4-5.4L15 9.7l-4 4Z",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const formattedDate = new Intl.DateTimeFormat("pt-BR").format(date);
  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${formattedDate} às ${formattedTime}`;
}

function formatLabel(value?: string | null): string {
  if (!value) return "-";

  if (value === "REANALISE") {
    return "Em reanálise";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function HomePage() {
  const navigate = useNavigate();
  const { usuario, loading, error } = useUserInfo();

  const quickAccess = useMemo(
    () => [
      {
        title: "Cabine de Votação",
        description: "Acesse as votações disponíveis.",
        icon: "vote" as const,
        to: "/votacao/cabine",
        visible: true,
      },
      {
        title: "Meus Dados",
        description: "Consulte e atualize suas informações pessoais.",
        icon: "user" as const,
        to: "/minha-conta/dados-pessoais",
        visible: true,
      },
      {
        title: "Confirmação de Identidade",
        description: "Analise os cadastros enviados pelos membros.",
        icon: "fingerprint" as const,
        to: "/cpe/confirmacao-identidade",
        visible: canAccessIdentity(usuario?.tipoUsuario),
      },
      {
        title: "Gestão de Privilégios",
        description: "Gerencie os níveis de acesso dos membros.",
        icon: "shield" as const,
        to: "/administracao/privilegios",
        visible: canManagePrivileges(usuario?.tipoUsuario),
      },
    ],
    [usuario?.tipoUsuario]
  );

  if (loading) {
    return (
      <section className="portal-state" role="status">
        Carregando informações do usuário...
      </section>
    );
  }

  if (error || !usuario) {
    return (
      <section className="portal-state portal-state--error" role="alert">
        {error ?? "Não foi possível carregar as informações do usuário."}
      </section>
    );
  }

  const campo =
    usuario.campoEclesiastico?.nomeCampo ??
    (usuario.campoEclesiasticoId ? `Campo ${usuario.campoEclesiasticoId}` : "-");

  return (
    <section className="portal-page" aria-labelledby="home-title">
      <header className="portal-pageHeader">
        <h1 id="home-title">Início</h1>
        <p>
          Bem-vindo ao sistema E-Voto. Consulte suas informações e acesse as
          funcionalidades disponíveis para seu perfil.
        </p>
      </header>

      <section className="home-summary" aria-labelledby="home-account-title">
        <div className="home-summaryHeader">
          <h2 id="home-account-title">Minha conta</h2>
          <span className={`portal-badge portal-badge--${String(usuario.situacaoUsuario ?? "ativo").toLowerCase()}`}>
            {formatLabel(usuario.situacaoUsuario ?? "ATIVO")}
          </span>
        </div>

        <div className="home-summaryGrid">
          <div className="home-summaryItem">
            <span>Nome</span>
            <strong>{usuario.nome}</strong>
          </div>
          <div className="home-summaryItem">
            <span>Cargo</span>
            <strong>{formatLabel(usuario.cargo)}</strong>
          </div>
          <div className="home-summaryItem">
            <span>Campo</span>
            <strong>{campo}</strong>
          </div>
          <div className="home-summaryItem">
            <span>Último acesso</span>
            <strong>{formatDateTime(usuario.ultimoLogin)}</strong>
          </div>
        </div>
      </section>

      <section className="home-quick" aria-labelledby="home-quick-title">
        <h2 id="home-quick-title">Acessos rápidos</h2>

        <div className="home-quickGrid">
          {quickAccess
            .filter((item) => item.visible)
            .map((item) => (
              <button
                className="home-quickCard"
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
              >
                <span className="home-quickIcon" aria-hidden="true">
                  <QuickIcon name={item.icon} />
                </span>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
                <em aria-hidden="true">→</em>
              </button>
            ))}
        </div>
      </section>
    </section>
  );
}
