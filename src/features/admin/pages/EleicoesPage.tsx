import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  cadastrarEleicao,
  excluirEleicao,
  listarEleicoes,
  type Eleicao,
  type EleicaoPayload,
} from "@features/admin/api/eleicaoApi";
import {
  listarEventos,
  type Evento,
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
import {
  formatarDataHoraToBr,
  formatarDataToBr,
} from "@shared/utils/formataData";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import "@features/user/pages/HomePage.css";
import "@features/identity/pages/IdentityConfirmationPage.css";
import "./EleicoesPage.css";

const pageSize = 10;
const supportPageSize = 500;
const periodoErrorMessage = "A data final não pode ser anterior à data inicial.";
const periodoEventoErrorMessage =
  "A data inicial da eleição deve estar dentro do período do evento selecionado.";
const votacaoAntesInicialErrorMessage =
  "O início da votação não pode ser anterior à data inicial da eleição.";
const votacaoAposFinalErrorMessage =
  "O início da votação não pode ser posterior à data final da eleição.";
const votacaoAposApuracaoErrorMessage =
  "O início da votação não pode ser posterior ao início da apuração.";
const apuracaoErrorMessage =
  "O início da apuração deve estar dentro do período da eleição.";

type EleicaoForm = {
  eventoId?: number;
  dataInicial: string;
  dataFinal: string;
  dataInicioVotacao: string;
  dataInicioApuracao: string;
  dataCadastro: string;
  chavePublica: string;
  fingerprint: string;
  tamanhoBits: string;
};

type EleicaoFormErrors = Partial<Record<keyof EleicaoForm, string>>;

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

function getTodayDateISO() {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function createInitialForm(): EleicaoForm {
  return {
    dataInicial: "",
    dataFinal: "",
    dataInicioVotacao: "",
    dataInicioApuracao: "",
    dataCadastro: getTodayDateISO(),
    chavePublica: "",
    fingerprint: "",
    tamanhoBits: "",
  };
}

function toConvencaoOptions(convencoes: Convencao[]): DropdownOption<number>[] {
  return convencoes.map((convencao) => ({
    value: convencao.convencaoId,
    label: convencao.nomeConvencao,
  }));
}

function toEventoOptions(eventos: Evento[]): DropdownOption<number>[] {
  return eventos.map((evento) => ({
    value: evento.eventoId,
    label: evento.nomeEvento,
  }));
}

function formatDate(value?: string | null) {
  return value ? formatarDataToBr(value) : "—";
}

function formatDateTime(value?: string | null) {
  return value ? formatarDataHoraToBr(value) : "—";
}

function normalizeDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

function getVotacaoMax(form: EleicaoForm) {
  return form.dataFinal ? `${form.dataFinal}T23:59` : undefined;
}

function trimToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isElectionStartInsideEvent(form: EleicaoForm, evento?: Evento) {
  if (!evento || !form.dataInicial) return true;

  return (
    form.dataInicial >= evento.dataInicial &&
    form.dataInicial <= evento.dataFinal
  );
}

function validateForm(
  form: EleicaoForm,
  selectedEvento?: Evento
): EleicaoFormErrors {
  const errors: EleicaoFormErrors = {};

  if (!form.eventoId) {
    errors.eventoId = "O evento é obrigatório.";
  }

  if (!form.dataInicial) {
    errors.dataInicial = "A data inicial é obrigatória.";
  } else if (!isElectionStartInsideEvent(form, selectedEvento)) {
    errors.dataInicial = periodoEventoErrorMessage;
  }

  if (!form.dataFinal) {
    errors.dataFinal = "A data final é obrigatória.";
  } else if (form.dataInicial && form.dataFinal < form.dataInicial) {
    errors.dataFinal = periodoErrorMessage;
  }

  if (!form.dataInicioApuracao) {
    errors.dataInicioApuracao = "O início da apuração é obrigatório.";
  } else if (
    form.dataInicial &&
    form.dataFinal &&
    (normalizeDateTime(form.dataInicioApuracao) < `${form.dataInicial}T00:00:00` ||
      normalizeDateTime(form.dataInicioApuracao) > `${form.dataFinal}T23:59:59`)
  ) {
    errors.dataInicioApuracao = apuracaoErrorMessage;
  }

  if (!form.dataInicioVotacao) {
    errors.dataInicioVotacao = "O início da votação é obrigatório.";
  } else if (
    form.dataInicial &&
    normalizeDateTime(form.dataInicioVotacao) < `${form.dataInicial}T00:00:00`
  ) {
    errors.dataInicioVotacao = votacaoAntesInicialErrorMessage;
  } else if (
    form.dataFinal &&
    normalizeDateTime(form.dataInicioVotacao) > `${form.dataFinal}T23:59:59`
  ) {
    errors.dataInicioVotacao = votacaoAposFinalErrorMessage;
  } else if (
    form.dataInicioApuracao &&
    normalizeDateTime(form.dataInicioVotacao) >
      normalizeDateTime(form.dataInicioApuracao)
  ) {
    errors.dataInicioVotacao = votacaoAposApuracaoErrorMessage;
  }

  if (!form.dataCadastro) {
    errors.dataCadastro = "A data de cadastro é obrigatória.";
  }

  return errors;
}

function hasErrors(errors: EleicaoFormErrors) {
  return Object.values(errors).some(Boolean);
}

function toPayload(form: EleicaoForm): EleicaoPayload {
  const tamanhoBits = form.tamanhoBits.trim();

  return {
    eventoId: form.eventoId!,
    dataInicial: form.dataInicial,
    dataFinal: form.dataFinal,
    dataInicioVotacao: normalizeDateTime(form.dataInicioVotacao),
    dataInicioApuracao: normalizeDateTime(form.dataInicioApuracao),
    chavePublica: trimToNull(form.chavePublica),
    fingerprint: trimToNull(form.fingerprint),
    tamanhoBits: tamanhoBits ? Number(tamanhoBits) : null,
    dataCadastro: form.dataCadastro || getTodayDateISO(),
  };
}

export function EleicoesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<Eleicao> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convencoes, setConvencoes] = useState<Convencao[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [filterEventos, setFilterEventos] = useState<Evento[]>([]);
  const [filterEventosLoading, setFilterEventosLoading] = useState(false);
  const [filterEventosError, setFilterEventosError] = useState<string | null>(
    null
  );
  const [dialogEventos, setDialogEventos] = useState<Evento[]>([]);
  const [dialogEventosLoading, setDialogEventosLoading] = useState(false);
  const [dialogEventosError, setDialogEventosError] = useState<string | null>(
    null
  );
  const [filterConvencaoId, setFilterConvencaoId] = useState<number | undefined>();
  const [filterEventoId, setFilterEventoId] = useState<number | undefined>();
  const [filterDataInicial, setFilterDataInicial] = useState("");
  const [filterDataFinal, setFilterDataFinal] = useState("");
  const [filterDataInicioVotacao, setFilterDataInicioVotacao] = useState("");
  const [filterDataInicioApuracao, setFilterDataInicioApuracao] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EleicaoForm>(() => createInitialForm());
  const [formErrors, setFormErrors] = useState<EleicaoFormErrors>({});
  const [formTouched, setFormTouched] = useState<
    Partial<Record<keyof EleicaoForm, boolean>>
  >({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const convencaoOptions = useMemo(
    () => toConvencaoOptions(convencoes),
    [convencoes]
  );
  const filterEventoOptions = useMemo(
    () => toEventoOptions(filterEventos),
    [filterEventos]
  );
  const dialogEventoOptions = useMemo(
    () => toEventoOptions(dialogEventos),
    [dialogEventos]
  );
  const selectedDialogEvento = useMemo(
    () => dialogEventos.find((evento) => evento.eventoId === form.eventoId),
    [dialogEventos, form.eventoId]
  );
  const filterPeriodoError =
    filterDataInicial && filterDataFinal && filterDataFinal < filterDataInicial
      ? periodoErrorMessage
      : null;
  const hasFilters = Boolean(
    filterConvencaoId ||
      filterEventoId ||
      filterDataInicial ||
      filterDataFinal ||
      filterDataInicioVotacao ||
      filterDataInicioApuracao
  );

  async function loadEleicoes(nextPage = page, signal?: AbortSignal) {
    if (filterPeriodoError) {
      setLoading(false);
      setData(null);
      setError(filterPeriodoError);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await listarEleicoes(
        nextPage,
        pageSize,
        {
          convencaoId: filterConvencaoId,
          eventoId: filterEventoId,
          dataInicial: filterDataInicial,
          dataFinal: filterDataFinal,
          dataInicioVotacao: filterDataInicioVotacao
            ? normalizeDateTime(filterDataInicioVotacao)
            : undefined,
          dataInicioApuracao: filterDataInicioApuracao
            ? normalizeDateTime(filterDataInicioApuracao)
            : undefined,
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

    async function loadFilterEventos() {
      try {
        setFilterEventosLoading(true);
        setFilterEventosError(null);
        const response = await listarEventos(
          0,
          supportPageSize,
          { convencaoId: filterConvencaoId },
          controller.signal
        );

        setFilterEventos(response.content);
        setFilterEventoId((current) => {
          if (!current) return current;
          return response.content.some((evento) => evento.eventoId === current)
            ? current
            : undefined;
        });
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setFilterEventos([]);
        setFilterEventosError("Não foi possível carregar os eventos.");
      } finally {
        if (!controller.signal.aborted) {
          setFilterEventosLoading(false);
        }
      }
    }

    void loadFilterEventos();

    return () => controller.abort();
  }, [filterConvencaoId]);

  useEffect(() => {
    if (!dialogOpen) return;

    const controller = new AbortController();

    async function loadDialogEventos() {
      try {
        setDialogEventosLoading(true);
        setDialogEventosError(null);
        const response = await listarEventos(
          0,
          supportPageSize,
          {},
          controller.signal
        );
        setDialogEventos(response.content);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setDialogEventos([]);
        setDialogEventosError("Não foi possível carregar os eventos.");
      } finally {
        if (!controller.signal.aborted) {
          setDialogEventosLoading(false);
        }
      }
    }

    void loadDialogEventos();

    return () => controller.abort();
  }, [dialogOpen]);

  useEffect(() => {
    const controller = new AbortController();
    void loadEleicoes(page, controller.signal);
    return () => controller.abort();
  }, [
    filterConvencaoId,
    filterDataFinal,
    filterDataInicial,
    filterDataInicioApuracao,
    filterDataInicioVotacao,
    filterEventoId,
    filterPeriodoError,
    page,
  ]);

  function handleFilterConvencaoChange(convencaoId: number) {
    setFilterConvencaoId(convencaoId);
    setFilterEventoId((current) => {
      if (!current) return current;
      const selectedEvento = filterEventos.find(
        (evento) => evento.eventoId === current
      );

      return selectedEvento?.convencaoId === convencaoId ? current : undefined;
    });
    setPage(0);
  }

  function clearFilters() {
    setFilterConvencaoId(undefined);
    setFilterEventoId(undefined);
    setFilterDataInicial("");
    setFilterDataFinal("");
    setFilterDataInicioVotacao("");
    setFilterDataInicioApuracao("");
    setPage(0);
  }

  function resetDialog() {
    setDialogOpen(false);
    setDialogEventos([]);
    setDialogEventosError(null);
    setForm(createInitialForm());
    setFormErrors({});
    setFormTouched({});
    setSaving(false);
  }

  function openCreateDialog() {
    setForm(createInitialForm());
    setFormErrors({});
    setFormTouched({});
    setDialogEventosError(null);
    setDialogOpen(true);
  }

  function updateForm<K extends keyof EleicaoForm>(
    field: K,
    value: EleicaoForm[K]
  ) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (formTouched[field]) {
        const nextSelectedEvento =
          field === "eventoId"
            ? dialogEventos.find((evento) => evento.eventoId === value)
            : selectedDialogEvento;
        setFormErrors(validateForm(next, nextSelectedEvento));
      }

      return next;
    });
  }

  function touchField(field: keyof EleicaoForm) {
    setFormTouched((current) => ({ ...current, [field]: true }));
    setFormErrors(validateForm(form, selectedDialogEvento));
  }

  async function handleSave() {
    if (saving) return;

    const errors = validateForm(form, selectedDialogEvento);
    setFormErrors(errors);
    setFormTouched({
      eventoId: true,
      dataInicial: true,
      dataFinal: true,
      dataInicioVotacao: true,
      dataInicioApuracao: true,
    });

    if (hasErrors(errors)) {
      await alerts.warn({ text: "Revise as informações antes de salvar." });
      return;
    }

    try {
      setSaving(true);
      alerts.loading({
        title: "Cadastrando eleição...",
      });

      await cadastrarEleicao(toPayload(form));

      alerts.close();
      await alerts.success({
        text: "Eleição cadastrada com sucesso.",
      });

      resetDialog();
      await loadEleicoes(0);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(eleicao: Eleicao) {
    if (deletingId) return;

    const confirmed = await alerts.confirm({
      title: "Excluir eleição",
      text: `Deseja realmente excluir a eleição "${eleicao.nomeEvento}" da convenção ${eleicao.nomeConvencao}?`,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setDeletingId(eleicao.eleicaoId);
      alerts.loading({ title: "Excluindo eleição..." });
      await excluirEleicao(eleicao.eleicaoId);
      alerts.close();
      await alerts.success({ text: "Eleição excluída com sucesso." });

      const currentItems = data?.content.length ?? 0;
      const nextPage = currentItems === 1 && page > 0 ? page - 1 : page;
      await loadEleicoes(nextPage);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setDeletingId(null);
    }
  }

  const eleicoes = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const dialogTitle = "Cadastrar eleição";
  const dialogSubtitle = "Informe o evento, período da eleição e início da apuração.";
  const saveText = "Salvar eleição";
  const selectedEventPeriod = selectedDialogEvento
    ? `${formatDate(selectedDialogEvento.dataInicial)} a ${formatDate(
        selectedDialogEvento.dataFinal
      )}`
    : null;

  return (
    <section className="portal-page eleicoes-page" aria-labelledby="eleicoes-title">
      <div className="eleicoes-headerRow">
        <GestaoBackButton
          ariaLabel="Voltar para Eventos e Eleições"
          to="/processo-eleitoral"
        />
        <button
          className="eleicoes-primaryButton"
          type="button"
          onClick={openCreateDialog}
        >
          + Nova eleição
        </button>
      </div>

      <header className="portal-pageHeader">
        <h1 id="eleicoes-title">Gestão de Eleições</h1>
        <p>Gerencie as eleições vinculadas aos eventos e seus períodos de realização.</p>
      </header>

      <section className="eleicoes-filterCard" aria-label="Filtros de eleições">
        <div className="eleicoes-filterHeader">
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
              supportLoading
                ? "Carregando convenções..."
                : "Nenhuma convenção encontrada"
            }
            disabled={supportLoading || !!supportError}
            onChange={handleFilterConvencaoChange}
          />
        </FormField>

        <FormField label="Evento">
          <DropdownField<number>
            value={filterEventoId}
            options={filterEventoOptions}
            placeholder={filterEventosLoading ? "Carregando..." : "Buscar por evento"}
            searchPlaceholder="Buscar evento..."
            emptyText={
              filterEventosLoading
                ? "Carregando eventos..."
                : "Nenhum evento encontrado"
            }
            disabled={filterEventosLoading || !!filterEventosError}
            onChange={(value) => {
              setFilterEventoId(value);
              setPage(0);
            }}
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

        <FormField label="Início da votação">
          <input
            className="vf-input"
            type="datetime-local"
            value={filterDataInicioVotacao}
            onChange={(event) => {
              setFilterDataInicioVotacao(event.target.value);
              setPage(0);
            }}
          />
        </FormField>

        <FormField label="Início da apuração">
          <input
            className="vf-input"
            type="datetime-local"
            value={filterDataInicioApuracao}
            onChange={(event) => {
              setFilterDataInicioApuracao(event.target.value);
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

        {filterPeriodoError ? (
          <div className="eleicoes-filterError">{filterPeriodoError}</div>
        ) : null}
      </section>

      {supportError ? (
        <div className="portal-state portal-state--error">{supportError}</div>
      ) : null}

      {filterEventosError ? (
        <div className="portal-state portal-state--error">{filterEventosError}</div>
      ) : null}

      <section className="identity-tableCard">
        {loading ? (
          <div className="portal-state">Carregando eleições...</div>
        ) : error ? (
          <div className="portal-state portal-state--error">{error}</div>
        ) : eleicoes.length === 0 ? (
          <div className="identity-empty">
            <strong>Nenhuma eleição encontrada</strong>
            <span>Nenhuma eleição encontrada para os filtros informados.</span>
          </div>
        ) : (
          <div className="identity-tableWrap">
            <table className="identity-table eleicoes-table">
              <thead>
                <tr>
                  <th>Convenção</th>
                  <th>Evento</th>
                  <th>Data inicial</th>
                  <th>Início da votação</th>
                  <th>Início da apuração</th>
                  <th>Data final</th>
                  <th>Data de cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {eleicoes.map((eleicao) => (
                  <tr key={eleicao.eleicaoId}>
                    <td>
                      <span className="eleicoes-convencao">
                        {eleicao.nomeConvencao}
                      </span>
                    </td>
                    <td>
                      <span className="eleicoes-name">{eleicao.nomeEvento}</span>
                    </td>
                    <td>{formatDate(eleicao.dataInicial)}</td>
                    <td>{formatDateTime(eleicao.dataInicioVotacao)}</td>
                    <td>{formatDateTime(eleicao.dataInicioApuracao)}</td>
                    <td>{formatDate(eleicao.dataFinal)}</td>
                    <td>{formatDate(eleicao.dataCadastro)}</td>
                    <td>
                      <div className="eleicoes-actions">
                        <button
                          type="button"
                          title="Editar eleição"
                          aria-label={`Editar eleição ${eleicao.nomeEvento}`}
                          onClick={() =>
                            navigate(
                              `/processo-eleitoral/eleicoes/${eleicao.eleicaoId}/editar`
                            )
                          }
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          title="Excluir eleição"
                          aria-label={`Excluir eleição ${eleicao.nomeEvento}`}
                          disabled={deletingId === eleicao.eleicaoId}
                          onClick={() => void handleDelete(eleicao)}
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
          className="eleicoes-dialogLayer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eleicao-dialog-title"
        >
          <button
            className="eleicoes-dialogBackdrop"
            type="button"
            aria-label="Fechar"
            onClick={resetDialog}
          />
          <section className="eleicoes-dialog">
            <header className="eleicoes-dialogHeader">
              <div>
                <h2 id="eleicao-dialog-title">{dialogTitle}</h2>
                <p>{dialogSubtitle}</p>
              </div>
              <button type="button" aria-label="Fechar" onClick={resetDialog}>
                ×
              </button>
            </header>

            <div className="eleicoes-form">
              {dialogEventosError ? (
                <div className="eleicoes-formError">{dialogEventosError}</div>
              ) : null}

              <FormField
                label="Evento"
                required
                error={formTouched.eventoId ? formErrors.eventoId : undefined}
                helperText={
                  selectedDialogEvento ? (
                    <span className="eleicoes-eventMeta">
                      <strong>{selectedDialogEvento.nomeConvencao}</strong>
                      <span>Período do evento: {selectedEventPeriod}</span>
                    </span>
                  ) : null
                }
              >
                <DropdownField<number>
                  value={form.eventoId}
                  options={dialogEventoOptions}
                  placeholder={dialogEventosLoading ? "Carregando..." : "Selecione o evento"}
                  searchPlaceholder="Buscar evento..."
                  emptyText={
                    dialogEventosLoading
                      ? "Carregando eventos..."
                      : "Nenhum evento encontrado"
                  }
                  onChange={(value) => updateForm("eventoId", value)}
                  onBlur={() => touchField("eventoId")}
                  disabled={dialogEventosLoading || saving}
                  invalid={!!(formTouched.eventoId && formErrors.eventoId)}
                />
              </FormField>

              <div className="eleicoes-formRow">
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

              <div className="eleicoes-formRow">
                <FormField
                  label="Início da votação"
                  required
                  error={
                    formTouched.dataInicioVotacao
                      ? formErrors.dataInicioVotacao
                      : undefined
                  }
                >
                  <input
                    className="vf-input"
                    type="datetime-local"
                    value={form.dataInicioVotacao}
                    min={form.dataInicial ? `${form.dataInicial}T00:00` : undefined}
                    max={getVotacaoMax(form)}
                    onChange={(event) =>
                      updateForm("dataInicioVotacao", event.target.value)
                    }
                    onBlur={() => touchField("dataInicioVotacao")}
                    disabled={saving}
                    aria-invalid={
                      !!(
                        formTouched.dataInicioVotacao &&
                        formErrors.dataInicioVotacao
                      )
                    }
                  />
                </FormField>

                <FormField
                  label="Início da apuração"
                  required
                  error={
                    formTouched.dataInicioApuracao
                      ? formErrors.dataInicioApuracao
                      : undefined
                  }
                >
                  <input
                    className="vf-input"
                    type="datetime-local"
                    value={form.dataInicioApuracao}
                    min={form.dataInicial ? `${form.dataInicial}T00:00` : undefined}
                    max={form.dataFinal ? `${form.dataFinal}T23:59` : undefined}
                    onChange={(event) =>
                      updateForm("dataInicioApuracao", event.target.value)
                    }
                    onBlur={() => touchField("dataInicioApuracao")}
                    disabled={saving}
                    aria-invalid={
                      !!(
                        formTouched.dataInicioApuracao &&
                        formErrors.dataInicioApuracao
                      )
                    }
                  />
                </FormField>
              </div>

              <div className="eleicoes-infoBox">
                A data inicial da eleição deve estar dentro do evento selecionado, e a
                votação deve iniciar entre a data inicial e o início da apuração.
              </div>

            </div>

            <footer>
              <button type="button" onClick={resetDialog} disabled={saving}>
                Cancelar
              </button>
              <button
                className="eleicoes-saveButton"
                type="button"
                disabled={saving || dialogEventosLoading}
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
