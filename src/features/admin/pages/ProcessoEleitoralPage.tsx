import { GestaoHubCard } from "@features/admin/ui/GestaoHubCard";
import "@features/user/pages/HomePage.css";
import "./GestaoPage.css";
import "./ProcessoEleitoralPage.css";

export function ProcessoEleitoralPage() {
  function handleEleicoesClick() {
    // navigate("/processo-eleitoral/eleicoes");
  }

  return (
    <section
      className="portal-page processo-eleitoral-page"
      aria-labelledby="processo-eleitoral-title"
    >
      <header className="portal-pageHeader">
        <h1 id="processo-eleitoral-title">Eventos e Eleições</h1>
        <p>Gerencie os eventos e processos eleitorais das convenções.</p>
      </header>

      <section className="home-quick" aria-label="Recursos do processo eleitoral">
        <div className="home-quickGrid processo-eleitoral-grid">
          <GestaoHubCard
            description="Gerencie os eventos vinculados às convenções e seus períodos de realização."
            icon="calendar"
            title="Eventos"
            to="/processo-eleitoral/eventos"
          />

          <GestaoHubCard
            description="Gerencie os processos eleitorais, configurações e informações das eleições."
            icon="election"
            title="Eleições"
            onClick={handleEleicoesClick}
          />
        </div>
      </section>
    </section>
  );
}
