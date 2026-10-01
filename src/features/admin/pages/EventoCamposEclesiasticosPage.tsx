import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buscarEventoPorId, type Evento } from "@features/admin/api/eventoApi";
import { EventoCamposEclesiasticosSection } from "@features/admin/components/EventoCamposEclesiasticosSection";
import { GestaoBackButton } from "@features/admin/ui/GestaoPageActions";
import { formatarDataToBr } from "@shared/utils/formataData";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import "@features/user/pages/HomePage.css";
import "@features/identity/pages/IdentityConfirmationPage.css";
import "./EventoCamposEclesiasticosPage.css";

function formatDate(value?: string | null) {
  return value ? formatarDataToBr(value) : "—";
}

export function EventoCamposEclesiasticosPage() {
  const navigate = useNavigate();
  const params = useParams<{ eventoId: string }>();
  const eventoId = Number(params.eventoId);
  const hasValidEventoId = Number.isInteger(eventoId) && eventoId > 0;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periodLabel = evento
    ? `${formatDate(evento.dataInicial)} a ${formatDate(evento.dataFinal)}`
    : "—";

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvento() {
      if (!hasValidEventoId) {
        setLoading(false);
        setError("Evento não encontrado.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const eventoResponse = await buscarEventoPorId(
          eventoId,
          controller.signal
        );

        setEvento(eventoResponse);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setEvento(null);
        setError(handleAxiosError(requestError));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadEvento();

    return () => controller.abort();
  }, [eventoId, hasValidEventoId]);

  return (
    <section
      className="portal-page evento-campos-page"
      aria-labelledby="evento-campos-title"
    >
      <div className="evento-campos-headerRow">
        <GestaoBackButton
          ariaLabel="Voltar para Gestão de Eventos"
          to="/processo-eleitoral/eventos"
        />
      </div>

      <header className="portal-pageHeader">
        <h1 id="evento-campos-title">Campos Eclesiásticos do Evento</h1>
        <p>Defina os Campos Eclesiásticos que participarão deste evento.</p>
      </header>

      {loading ? (
        <div className="portal-state">Carregando evento...</div>
      ) : error ? (
        <div className="portal-state portal-state--error">{error}</div>
      ) : evento ? (
        <>
          <section className="evento-campos-summary" aria-label="Resumo do evento">
            <div>
              <span>Evento</span>
              <strong>{evento.nomeEvento}</strong>
            </div>
            <div>
              <span>Convenção</span>
              <strong>{evento.nomeConvencao}</strong>
            </div>
            <div>
              <span>Período</span>
              <strong>{periodLabel}</strong>
            </div>
          </section>

          <EventoCamposEclesiasticosSection
            evento={evento}
            onCancel={() => navigate("/processo-eleitoral/eventos")}
          />
        </>
      ) : null}
    </section>
  );
}
