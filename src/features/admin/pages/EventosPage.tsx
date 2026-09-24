import { useEffect, useMemo, useState } from "react";
import {
  atualizarEvento,
  cadastrarEvento,
  excluirEvento,
  listarEventos,
  type Evento,
  type EventoPayload,
} from "@features/admin/api/eventoApi";
import type { PageResponse } from "@features/admin/api/cargoApi";
import {
  listarConvencoes,
  type Convencao,
} from "@features/admin/api/convencaoApi";
import {
  ClearFiltersButton,
  GestaoBackButton,
} from "@features/admin/ui/GestaoPageActions";
import { alerts } from "@shared/lib/swal";
import {
  DropdownField,
  type DropdownOption,
} from "@shared/ui/dropdown/DropdownField";
import { FormField } from "@shared/ui/form/FormField";
import { formatarDataToBr } from "@shared/utils/formataData";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import "@features/user/pages/HomePage.css";
import "@features/identity/pages/IdentityConfirmationPage.css";
import "./EventosPage.css";

const pageSize = 10;
const searchDelayMs = 350;
const periodoErrorMessage = "A data final não pode ser anterior à data inicial.";

type StatusFilter = "" | "true" | "false";

type EventoForm = {
  convencaoId?: number;
  nomeEvento: string;
  dataInicial: string;
  dataFinal: string;
  statusAtivo: boolean;
};

type EventoFormErrors = Partial<Record<keyof EventoForm, string>>;

const initialForm: EventoForm = {
  nomeEvento: "",
  dataInicial: "",
  dataFinal: "",
  statusAtivo: true,
};

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 17.3V20h2.7L17.8 8.9l-2.7-2.7L4 17.3Zm15.9-10.5a1 1 0 0 0 0-1.4l-1.3-1.3a1 1 0 0 0-1.4 0L16 5.3 18.7 8l1.2-1.2Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 11H7L6 9Zm3 2 .5 7h2L11 11H9Zm4 0-.5 7h2l.5-7h-2Z" />
    </svg>
  );
}

function toConvencaoOptions(convencoes: Convencao[]): DropdownOption<number>[] {
  return convencoes.map((convencao) => ({
    value: convencao.convencaoId,
    label: convencao.nomeConvencao,
  }));
}

function statusToFilter(value: StatusFilter): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function formatDate(value?: string | null) {
  return value ? formatarDataToBr(value) : "—";
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

export function EventosPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<Evento> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convencoes, setConvencoes] = useState<Convencao[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [filterConvencaoId, setFilterConvencaoId] = useState<number | undefined>();
  const [filterNomeEvento, setFilterNomeEvento] = useState("");
  const [debouncedFilterNomeEvento, setDebouncedFilterNomeEvento] = useState("");
  const [filterDataInicial, setFilterDataInicial] = useState("");
  const [filterDataFinal, setFilterDataFinal] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [form, setForm] = useState<EventoForm>(initialForm);
  const [formErrors, setFormErrors] = useState<EventoFormErrors>({});
  const [formTouched, setFormTouched] = useState<
    Partial<Record<keyof EventoForm, boolean>>
  >({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const convencaoOptions = useMemo(
    () => toConvencaoOptions(convencoes),
    [convencoes]
  );
  const filterPeriodoError =
    filterDataInicial && filterDataFinal && filterDataFinal < filterDataInicial
      ? periodoErrorMessage
      : null;
  const hasFilters = Boolean(
    filterConvencaoId ||
      filterNomeEvento.trim() ||
      filterDataInicial ||
      filterDataFinal ||
      filterStatus
  );

  async function loadEventos(nextPage = page, signal?: AbortSignal) {
    if (filterPeriodoError) {
      setLoading(false);
      setData(null);
      setError(filterPeriodoError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await listarEventos(
        nextPage,
        pageSize,
        {
          convencaoId: filterConvencaoId,
          nomeEvento: debouncedFilterNomeEvento,
          dataInicial: filterDataInicial,
          dataFinal: filterDataFinal,
          statusAtivo: statusToFilter(filterStatus),
        },
        signal
      );

      setData(response);
      setPage(response.number ?? nextPage);
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return;

      setData(null);
      setError(handleAxiosError(requestError));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFilterNomeEvento(filterNomeEvento.trim());
      setPage(0);
    }, searchDelayMs);

    return () => window.clearTimeout(timeout);
  }, [filterNomeEvento]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSupportData() {
      try {
        setSupportLoading(true);
        setSupportError(null);
        const response = await listarConvencoes(controller.signal);
        setConvencoes(response);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setConvencoes([]);
        setSupportError("Não foi possível carregar as convenções.");
      } finally {
        if (!controller.signal.aborted) {
          setSupportLoading(false);
        }
      }
    }

    void loadSupportData();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadEventos(page, controller.signal);
    return () => controller.abort();
  }, [
    debouncedFilterNomeEvento,
    filterConvencaoId,
    filterDataFinal,
    filterDataInicial,
    filterPeriodoError,
    filterStatus,
    page,
  ]);

  function clearFilters() {
    setFilterConvencaoId(undefined);
    setFilterNomeEvento("");
    setDebouncedFilterNomeEvento("");
    setFilterDataInicial("");
    setFilterDataFinal("");
    setFilterStatus("");
    setPage(0);
  }

  function resetDialog() {
    setDialogOpen(false);
    setSelectedEvento(null);
    setForm(initialForm);
    setFormErrors({});
    setFormTouched({});
    setSaving(false);
  }

  function openCreateDialog() {
    setSelectedEvento(null);
    setForm(initialForm);
    setFormErrors({});
    setFormTouched({});
    setDialogOpen(true);
  }

  function openEditDialog(evento: Evento) {
    setSelectedEvento(evento);
    setForm({
      convencaoId: evento.convencaoId,
      nomeEvento: evento.nomeEvento,
      dataInicial: evento.dataInicial,
      dataFinal: evento.dataFinal,
      statusAtivo: Boolean(evento.statusAtivo),
    });
    setFormErrors({});
    setFormTouched({});
    setDialogOpen(true);
  }

  function updateForm<K extends keyof EventoForm>(
    field: K,
    value: EventoForm[K]
  ) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (formTouched[field]) {
        setFormErrors(validateForm(next));
      }

      return next;
    });
  }

  function touchField(field: keyof EventoForm) {
    setFormTouched((current) => ({ ...current, [field]: true }));
    setFormErrors(validateForm(form));
  }

  async function handleSave() {
    if (saving) return;

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
      alerts.loading({
        title: selectedEvento ? "Salvando alterações..." : "Cadastrando evento...",
      });

      if (selectedEvento) {
        await atualizarEvento(selectedEvento.eventoId, toPayload(form));
      } else {
        await cadastrarEvento(toPayload(form));
      }

      alerts.close();
      await alerts.success({
        text: selectedEvento
          ? "Evento atualizado com sucesso."
          : "Evento cadastrado com sucesso.",
      });

      const nextPage = selectedEvento ? page : 0;
      resetDialog();
      await loadEventos(nextPage);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(evento: Evento) {
    if (deletingId) return;

    const confirmed = await alerts.confirm({
      title: "Excluir evento",
      text: `Deseja realmente excluir o evento "${evento.nomeEvento}" da convenção ${evento.nomeConvencao}?`,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setDeletingId(evento.eventoId);
      alerts.loading({ title: "Excluindo evento..." });
      await excluirEvento(evento.eventoId);
      alerts.close();
      await alerts.success({ text: "Evento excluído com sucesso." });

      const currentItems = data?.content.length ?? 0;
      const nextPage = currentItems === 1 && page > 0 ? page - 1 : page;
      await loadEventos(nextPage);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setDeletingId(null);
    }
  }

  const eventos = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const dialogTitle = selectedEvento ? "Editar evento" : "Cadastrar evento";
  const saveText = selectedEvento ? "Salvar alterações" : "Salvar evento";

  return (
    <section className="portal-page eventos-page" aria-labelledby="eventos-title">
      <div className="eventos-headerRow">
        <GestaoBackButton
          ariaLabel="Voltar para Eventos e Eleições"
          to="/processo-eleitoral"
        />
        <button
          className="eventos-primaryButton"
          type="button"
          onClick={openCreateDialog}
          disabled={supportLoading || !!supportError}
        >
          + Novo evento
        </button>
      </div>

      <header className="portal-pageHeader">
        <h1 id="eventos-title">Gestão de Eventos</h1>
        <p>Gerencie os eventos vinculados às convenções.</p>
      </header>

      <section className="eventos-filterCard" aria-label="Filtros de eventos">
        <div className="eventos-filterHeader">
          <strong>Filtros de pesquisa</strong>
          <ClearFiltersButton disabled={!hasFilters} onClick={clearFilters} />
        </div>

        <FormField label="Convenção">
          <DropdownField<number>
            value={filterConvencaoId}
            options={convencaoOptions}
            placeholder={supportLoading ? "Carregando..." : "Todas as convenções"}
            searchPlaceholder="Buscar convenção..."
            emptyText={
              supportLoading ? "Carregando convenções..." : "Nenhuma convenção encontrada"
            }
            disabled={supportLoading || !!supportError}
            onChange={(value) => {
              setFilterConvencaoId(value);
              setPage(0);
            }}
          />
        </FormField>

        <FormField label="Evento">
          <input
            className="vf-input"
            value={filterNomeEvento}
            onChange={(event) => setFilterNomeEvento(event.target.value)}
            placeholder="Nome do evento..."
          />
        </FormField>

        <FormField label="Data inicial">
          <input
            className="vf-input"
            type="date"
            value={filterDataInicial}
            onChange={(event) => {
              setFilterDataInicial(event.target.value);
              setPage(0);
            }}
          />
        </FormField>

        <FormField label="Data final">
          <input
            className="vf-input"
            type="date"
            value={filterDataFinal}
            min={filterDataInicial || undefined}
            onChange={(event) => {
              setFilterDataFinal(event.target.value);
              setPage(0);
            }}
            aria-invalid={!!filterPeriodoError}
          />
        </FormField>

        <FormField label="Situação">
          <select
            className="vf-input"
            value={filterStatus}
            onChange={(event) => {
              setFilterStatus(event.target.value as StatusFilter);
              setPage(0);
            }}
          >
            <option value="">Todas</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </FormField>

        {filterPeriodoError ? (
          <div className="eventos-filterError">{filterPeriodoError}</div>
        ) : null}
      </section>

      {supportError ? (
        <div className="portal-state portal-state--error">{supportError}</div>
      ) : null}

      <section className="identity-tableCard">
        {loading ? (
          <div className="portal-state">Carregando eventos...</div>
        ) : error ? (
          <div className="portal-state portal-state--error">{error}</div>
        ) : eventos.length === 0 ? (
          <div className="identity-empty">
            <strong>Nenhum evento encontrado</strong>
            <span>Nenhum evento encontrado para os filtros informados.</span>
          </div>
        ) : (
          <div className="identity-tableWrap">
            <table className="identity-table eventos-table">
              <thead>
                <tr>
                  <th>Convenção</th>
                  <th>Evento</th>
                  <th>Data inicial</th>
                  <th>Data final</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.eventoId}>
                    <td>
                      <span className="eventos-convencao">{evento.nomeConvencao}</span>
                    </td>
                    <td>
                      <span className="eventos-name">{evento.nomeEvento}</span>
                    </td>
                    <td>{formatDate(evento.dataInicial)}</td>
                    <td>{formatDate(evento.dataFinal)}</td>
                    <td>
                      <span
                        className={`portal-badge portal-badge--${
                          evento.statusAtivo ? "ativo" : "reprovado"
                        }`}
                      >
                        {evento.statusAtivo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="eventos-actions">
                        <button
                          type="button"
                          title="Editar evento"
                          aria-label={`Editar evento ${evento.nomeEvento}`}
                          onClick={() => openEditDialog(evento)}
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          title="Excluir evento"
                          aria-label={`Excluir evento ${evento.nomeEvento}`}
                          disabled={deletingId === evento.eventoId}
                          onClick={() => void handleDelete(evento)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="identity-pagination">
          <span>
            Página {page + 1} de {Math.max(totalPages, 1)}
          </span>
          <div>
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <button
              type="button"
              disabled={totalPages === 0 || page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </button>
          </div>
        </footer>
      </section>

      {dialogOpen ? (
        <div
          className="eventos-dialogLayer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evento-dialog-title"
        >
          <button
            className="eventos-dialogBackdrop"
            type="button"
            aria-label="Fechar"
            onClick={resetDialog}
          />
          <section className="eventos-dialog">
            <header className="eventos-dialogHeader">
              <h2 id="evento-dialog-title">{dialogTitle}</h2>
              <button type="button" aria-label="Fechar" onClick={resetDialog}>
                ×
              </button>
            </header>

            <div className="eventos-form">
              <FormField
                label="Convenção"
                required
                error={formTouched.convencaoId ? formErrors.convencaoId : undefined}
              >
                <DropdownField<number>
                  value={form.convencaoId}
                  options={convencaoOptions}
                  placeholder="Selecione a convenção"
                  searchPlaceholder="Buscar convenção..."
                  emptyText={
                    supportLoading
                      ? "Carregando convenções..."
                      : "Nenhuma convenção encontrada"
                  }
                  onChange={(value) => updateForm("convencaoId", value)}
                  onBlur={() => touchField("convencaoId")}
                  disabled={supportLoading || saving}
                  invalid={!!(formTouched.convencaoId && formErrors.convencaoId)}
                />
              </FormField>

              <FormField
                label="Nome do evento"
                required
                error={formTouched.nomeEvento ? formErrors.nomeEvento : undefined}
              >
                <input
                  className="vf-input"
                  value={form.nomeEvento}
                  maxLength={100}
                  placeholder="Digite o nome do evento"
                  onChange={(event) => updateForm("nomeEvento", event.target.value)}
                  onBlur={() => touchField("nomeEvento")}
                  disabled={saving}
                  aria-invalid={!!(formTouched.nomeEvento && formErrors.nomeEvento)}
                />
              </FormField>

              <div className="eventos-formRow">
                <FormField
                  label="Data inicial"
                  required
                  error={formTouched.dataInicial ? formErrors.dataInicial : undefined}
                >
                  <input
                    className="vf-input"
                    type="date"
                    value={form.dataInicial}
                    onChange={(event) => updateForm("dataInicial", event.target.value)}
                    onBlur={() => touchField("dataInicial")}
                    disabled={saving}
                    aria-invalid={!!(formTouched.dataInicial && formErrors.dataInicial)}
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
                    onChange={(event) => updateForm("dataFinal", event.target.value)}
                    onBlur={() => touchField("dataFinal")}
                    disabled={saving}
                    aria-invalid={!!(formTouched.dataFinal && formErrors.dataFinal)}
                  />
                </FormField>
              </div>

              <div className="eventos-statusField">
                <span>Status</span>
                <label className="eventos-switch">
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

            <footer>
              <button type="button" onClick={resetDialog} disabled={saving}>
                Cancelar
              </button>
              <button
                className="eventos-saveButton"
                type="button"
                disabled={saving || supportLoading}
                onClick={() => void handleSave()}
              >
                {saving ? "Salvando..." : saveText}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
