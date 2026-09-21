import { useUserInfo } from "@features/user/model/UserInfoContext";
import "./HomePage.css";

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
  const { usuario, loading, error } = useUserInfo();

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
    </section>
  );
}
