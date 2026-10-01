import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  atualizarEvento,
  buscarEventoPorId,
  type Evento,
  type EventoPayload,
} from "@features/admin/api/eventoApi";
import {
  listarConvencoes,
  type Convencao,
} from "@features/admin/api/convencaoApi";
import { EventoCamposEclesiasticosSection } from "@features/admin/components/EventoCamposEclesiasticosSection";
import { GestaoBackButton } from "@features/admin/ui/GestaoPageActions";
import { alerts } from "@shared/lib/swal";
import {
  DropdownField,
  type DropdownOption,
} from "@shared/ui/dropdown/DropdownField";
import { FormField } from "@shared/ui/form/FormField";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import "@features/user/pages/HomePage.css";
import "@features/identity/pages/IdentityConfirmationPage.css";
import "./EditarEventoPage.css";

const periodoErrorMessage = "A data final não pode ser anterior à data inicial.";

type EventoForm = {
  convencaoId?: number;
  nomeEvento: string;
  dataInicial: string;
  dataFinal: string;
  statusAtivo: boolean;
};

type EventoFormErrors = Partial<Record<keyof EventoForm, string>>;

function formFromEvento(evento: Evento): EventoForm {
  return {
    convencaoId: evento.convencaoId,
    nomeEvento: evento.nomeEvento,
    dataInicial: evento.dataInicial,
    dataFinal: evento.dataFinal,
    statusAtivo: Boolean(evento.statusAtivo),
  };
}

function toConvencaoOptions(convencoes: Convencao[]): DropdownOption<number>[] {
  return convencoes.map((convencao) => ({
    value: convencao.convencaoId,
    label: convencao.nomeConvencao,
  }));
}

function validateForm(form: EventoForm): EventoFormErrors {
  const errors: EventoFormErrors = {};
  const nomeEvento = form.nomeEvento.trim();

  if (!form.convencaoId) {
    errors.convencaoId = "A convenção é obrigatória.";
  }

  if (!nomeEvento) {
    errors.nomeEvento = "O nome do evento é obrigatório.";
  } else if (nomeEvento.length > 100) {
    errors.nomeEvento = "O nome do evento deve possuir no máximo 100 caracteres.";
  }

  if (!form.dataInicial) {
    errors.dataInicial = "A data inicial é obrigatória.";
  }

  if (!form.dataFinal) {
    errors.dataFinal = "A data final é obrigatória.";
  } else if (form.dataInicial && form.dataFinal < form.dataInicial) {
    errors.dataFinal = periodoErrorMessage;
  }

  if (typeof form.statusAtivo !== "boolean") {
    errors.statusAtivo = "O status é obrigatório.";
  }

  return errors;
}

function hasErrors(errors: EventoFormErrors) {
  return Object.values(errors).some(Boolean);
}

function toPayload(form: EventoForm): EventoPayload {
  return {
    convencaoId: form.convencaoId!,
    dataInicial: form.dataInicial,
    dataFinal: form.dataFinal,
    nomeEvento: form.nomeEvento.trim(),
    statusAtivo: form.statusAtivo,
  };
}

function SectionIcon({ type }: { type: "data" | "fields" }) {
  const paths = {
    data: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v12h12V6H6Zm2 2h8v2H8V8Zm0 4h8v2H8v-2Z",
    fields:
      "M7 4h10a2 2 0 0 1 2 2v3h-2V6H7v12h4v2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm8 7h6v2h-6v6h-2v-6H7v-2h6V5h2v6Z",
  };

  return (
    <span className="editar-evento-sectionIcon" aria-hidden>
      <svg viewBox="0 0 24 24">
        <path d={paths[type]} />
      </svg>
    </span>
  );
}

export function EditarEventoPage() {
  const params = useParams<{ eventoId: string }>();
  const eventoId = Number(params.eventoId);
  const hasValidEventoId = Number.isInteger(eventoId) && eventoId > 0;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [convencoes, setConvencoes] = useState<Convencao[]>([]);
  const [convencoesLoading, setConvencoesLoading] = useState(false);
  const [convencoesError, setConvencoesError] = useState<string | null>(null);
  const [form, setForm] = useState<EventoForm | null>(null);
  const [formErrors, setFormErrors] = useState<EventoFormErrors>({});
  const [formTouched, setFormTouched] = useState<
    Partial<Record<keyof EventoForm, boolean>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const convencaoOptions = useMemo(
    () => toConvencaoOptions(convencoes),
    [convencoes]
  );

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
        setForm(formFromEvento(eventoResponse));
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setEvento(null);
        setForm(null);
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

  useEffect(() => {
    const controller = new AbortController();

    async function loadConvencoes() {
      try {
        setConvencoesLoading(true);
        setConvencoesError(null);
        const response = await listarConvencoes(controller.signal);
        setConvencoes(response);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setConvencoes([]);
        setConvencoesError("Não foi possível carregar as convenções.");
      } finally {
        if (!controller.signal.aborted) {
          setConvencoesLoading(false);
        }
      }
    }

    void loadConvencoes();

    return () => controller.abort();
  }, []);

  function updateForm<K extends keyof EventoForm>(
    field: K,
    value: EventoForm[K]
  ) {
    setForm((current) => {
      if (!current) return current;

      const next = { ...current, [field]: value };

      if (formTouched[field]) {
        setFormErrors(validateForm(next));
      }

      return next;
    });
  }

  function touchField(field: keyof EventoForm) {
    if (!form) return;

    setFormTouched((current) => ({ ...current, [field]: true }));
    setFormErrors(validateForm(form));
  }

  async function handleSave() {
    if (!form || saving) return;

    const errors = validateForm(form);
    setFormErrors(errors);
    setFormTouched({
      convencaoId: true,
      nomeEvento: true,
      dataInicial: true,
      dataFinal: true,
      statusAtivo: true,
    });

    if (hasErrors(errors)) {
      await alerts.warn({ text: "Revise as informações antes de salvar." });
      return;
    }

    try {
      setSaving(true);
      alerts.loading({ title: "Salvando alterações..." });

      await atualizarEvento(eventoId, toPayload(form));

      const refreshed = await buscarEventoPorId(eventoId);
      const refreshedForm = formFromEvento(refreshed);

      alerts.close();
      setEvento(refreshed);
      setForm(refreshedForm);
      setFormTouched({});
      setFormErrors({});
      await alerts.success({ text: "Evento atualizado com sucesso." });
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="portal-page editar-evento-page"
      aria-labelledby="editar-evento-title"
    >
      <div className="editar-evento-backRow">
        <GestaoBackButton
          ariaLabel="Voltar para Gestão de Eventos"
          to="/processo-eleitoral/eventos"
        />
      </div>

      <header className="portal-pageHeader editar-evento-header">
        <div>
          <h1 id="editar-evento-title">Editar Evento</h1>
          <p>Gerencie os dados e campos eclesiásticos participantes deste evento.</p>
        </div>
        {evento ? (
          <span className="editar-evento-id">Evento: #{evento.eventoId}</span>
        ) : null}
      </header>

      {loading ? (
        <div className="portal-state">Carregando evento...</div>
      ) : error ? (
        <div className="portal-state portal-state--error">{error}</div>
      ) : form && evento ? (
        <>
          <section className="editar-evento-card" aria-label="Dados do evento">
            <header className="editar-evento-cardHeader">
              <div>
                <SectionIcon type="data" />
                <div>
                  <strong>Dados do Evento</strong>
                  <span>Atualize as informações e configurações deste evento.</span>
                </div>
              </div>
            </header>

            {convencoesError ? (
              <div className="portal-state portal-state--error">
                {convencoesError}
              </div>
            ) : null}

            <div className="editar-evento-formGrid">
              <div className="editar-evento-eventRow">
                <FormField
                  label="Convenção"
                  required
                  error={
                    formTouched.convencaoId ? formErrors.convencaoId : undefined
                  }
                >
                  <DropdownField<number>
                    value={form.convencaoId}
                    options={convencaoOptions}
                    placeholder={
                      convencoesLoading ? "Carregando..." : "Selecione a convenção"
                    }
                    searchPlaceholder="Buscar convenção..."
                    emptyText={
                      convencoesLoading
                        ? "Carregando convenções..."
                        : "Nenhuma convenção encontrada"
                    }
                    disabled={convencoesLoading || saving}
                    invalid={!!(formTouched.convencaoId && formErrors.convencaoId)}
                    onChange={(value) => updateForm("convencaoId", value)}
                    onBlur={() => touchField("convencaoId")}
                  />
                </FormField>

                <FormField
                  label="Nome do evento"
                  required
                  error={
                    formTouched.nomeEvento ? formErrors.nomeEvento : undefined
                  }
                >
                  <input
                    className="vf-input"
                    value={form.nomeEvento}
                    maxLength={100}
                    placeholder="Digite o nome do evento"
                    disabled={saving}
                    aria-invalid={
                      !!(formTouched.nomeEvento && formErrors.nomeEvento)
                    }
                    onChange={(event) =>
                      updateForm("nomeEvento", event.target.value)
                    }
                    onBlur={() => touchField("nomeEvento")}
                  />
                </FormField>
              </div>

              <div className="editar-evento-dateGrid">
                <FormField
                  label="Data inicial"
                  required
                  error={
                    formTouched.dataInicial ? formErrors.dataInicial : undefined
                  }
                >
                  <input
                    className="vf-input"
                    type="date"
                    value={form.dataInicial}
                    disabled={saving}
                    aria-invalid={
                      !!(formTouched.dataInicial && formErrors.dataInicial)
                    }
                    onChange={(event) =>
                      updateForm("dataInicial", event.target.value)
                    }
                    onBlur={() => touchField("dataInicial")}
                  />
                </FormField>

                <FormField
                  label="Data final"
                  required
                  error={formTouched.dataFinal ? formErrors.dataFinal : undefined}
                >
                  <input
                    className="vf-input"
                    type="date"
                    value={form.dataFinal}
                    min={form.dataInicial || undefined}
                    disabled={saving}
                    aria-invalid={!!(formTouched.dataFinal && formErrors.dataFinal)}
                    onChange={(event) =>
                      updateForm("dataFinal", event.target.value)
                    }
                    onBlur={() => touchField("dataFinal")}
                  />
                </FormField>

                <div className="editar-evento-statusField">
                  <span>Status</span>
                  <label className="editar-evento-switch">
                    <input
                      type="checkbox"
                      checked={form.statusAtivo}
                      onChange={(event) =>
                        updateForm("statusAtivo", event.target.checked)
                      }
                      disabled={saving}
                    />
                    <span aria-hidden />
                    <em>{form.statusAtivo ? "Ativo" : "Inativo"}</em>
                  </label>
                </div>
              </div>
            </div>

            <footer className="editar-evento-sectionFooter">
              <button
                className="editar-evento-primaryButton"
                type="button"
                disabled={saving || convencoesLoading}
                onClick={() => void handleSave()}
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </footer>
          </section>

          <section
            className="editar-evento-card"
            aria-label="Campos eclesiásticos participantes"
          >
            <header className="editar-evento-cardHeader">
              <div>
                <SectionIcon type="fields" />
                <div>
                  <strong>Campos Eclesiásticos Participantes</strong>
                  <span>Defina os Campos Eclesiásticos que participarão deste evento.</span>
                </div>
              </div>
            </header>

            <div className="editar-evento-sectionBody">
              <EventoCamposEclesiasticosSection evento={evento} />
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
