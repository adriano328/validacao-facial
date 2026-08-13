import "./HomePage.css";

export function VotingBoothPage() {
  return (
    <section className="portal-page" aria-labelledby="voting-title">
      <header className="portal-pageHeader">
        <h1 id="voting-title">Cabine de Votação</h1>
        <p>Acesse as votações disponíveis para seu perfil.</p>
      </header>

      <div className="portal-state">
        Nenhuma votação disponível no momento.
      </div>
    </section>
  );
}
