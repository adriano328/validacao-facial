import { useEffect, useMemo, useRef, useState } from "react";
import {
  atualizarMesaDiretora,
  cadastrarMesaDiretora,
  excluirMesaDiretora,
  listarMesasDiretoras,
  type MesaDiretora,
  type MesaDiretoraPayload,
} from "@features/admin/api/mesaDiretoraApi";
import {
  listarCargos,
  type CargoResponse,
  type PageResponse,
} from "@features/admin/api/cargoApi";
import {
  listarConvencoes,
  type Convencao,
} from "@features/admin/api/convencaoApi";
import {
  ClearFiltersButton,
  GestaoBackButton,
} from "@features/admin/ui/GestaoPageActions";
import {
  listarMembros,
  type UsuarioResponse,
} from "@features/user/api/userApi";
import { alerts } from "@shared/lib/swal";
import {
  DropdownField,
  type DropdownOption,
} from "@shared/ui/dropdown/DropdownField";
import { FormField } from "@shared/ui/form/FormField";
import { formatarDataToBr } from "@shared/utils/formataData";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import logoComademat from "@shared/assets/comademat-logo.png";
import "@features/user/pages/HomePage.css";
import "@features/identity/pages/IdentityConfirmationPage.css";
import "./MesaDiretoraPage.css";

const pageSize = 8;
const supportPageSize = 500;
const memberPageSize = 12;
const searchDelayMs = 350;

type MesaDiretoraForm = {
  convencaoId?: number;
  usuarioId?: number;
  cargoIdAdministrativo?: number;
  dataInicial: string;
  dataFinal: string;
};

type MesaDiretoraFormErrors = Partial<Record<keyof MesaDiretoraForm, string>>;

const initialForm: MesaDiretoraForm = {
  dataInicial: "",
  dataFinal: "",
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

function toCargoOptions(cargos: CargoResponse[]): DropdownOption<number>[] {
  return cargos.map((cargo) => ({
    value: cargo.cargoId,
    label: cargo.nomeCargo,
  }));
}

function toMembroOptions(membros: UsuarioResponse[]): DropdownOption<number>[] {
  return membros.map((membro) => ({
    value: membro.id,
    label: `${membro.nome}${membro.cpf ? ` - ${membro.cpf}` : ""}`,
  }));
}

function mergeSelectedMembroOption(
  options: DropdownOption<number>[],
  selected?: MesaDiretora | null
): DropdownOption<number>[] {
  if (!selected) return options;
  if (options.some((option) => option.value === selected.usuarioId)) return options;

  return [
    {
      value: selected.usuarioId,
      label: selected.nomeUsuario,
    },
    ...options,
  ];
}

function formatDate(value?: string | null) {
  return value ? formatarDataToBr(value) : "—";
}

function validateForm(form: MesaDiretoraForm): MesaDiretoraFormErrors {
  const errors: MesaDiretoraFormErrors = {};

  if (!form.convencaoId) {
    errors.convencaoId = "A convenção é obrigatória.";
  }

  if (!form.usuarioId) {
    errors.usuarioId = "O membro é obrigatório.";
  }

  if (!form.cargoIdAdministrativo) {
    errors.cargoIdAdministrativo = "O cargo é obrigatório.";
  }

  if (!form.dataInicial) {
    errors.dataInicial = "A data inicial é obrigatória.";
  }

  if (form.dataInicial && form.dataFinal && form.dataFinal < form.dataInicial) {
    errors.dataFinal = "A data final não pode ser anterior à data inicial.";
  }

  return errors;
}

function hasErrors(errors: MesaDiretoraFormErrors) {
  return Object.values(errors).some(Boolean);
}

function toPayload(form: MesaDiretoraForm): MesaDiretoraPayload {
  return {
    convencaoId: form.convencaoId!,
    usuarioId: form.usuarioId!,
    cargoIdAdministrativo: form.cargoIdAdministrativo!,
    dataInicial: form.dataInicial,
    dataFinal: form.dataFinal || null,
  };
}

export function MesaDiretoraPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<MesaDiretora> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convencoes, setConvencoes] = useState<Convencao[]>([]);
  const [filterConvencaoId, setFilterConvencaoId] = useState<number | undefined>();
  const [filterMembro, setFilterMembro] = useState("");
  const [debouncedFilterMembro, setDebouncedFilterMembro] = useState("");
  const [filterCargoId, setFilterCargoId] = useState<number | undefined>();
  const [filterCargos, setFilterCargos] = useState<CargoResponse[]>([]);
  const [filterCargosLoading, setFilterCargosLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<MesaDiretora | null>(null);
  const [dialogCargos, setDialogCargos] = useState<CargoResponse[]>([]);
  const [dialogCargosLoading, setDialogCargosLoading] = useState(false);
  const [dialogCargoError, setDialogCargoError] = useState<string | null>(null);
  const [membros, setMembros] = useState<UsuarioResponse[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [debouncedMemberSearch, setDebouncedMemberSearch] = useState("");
  const [membersLoading, setMembersLoading] = useState(false);
  const [form, setForm] = useState<MesaDiretoraForm>(initialForm);
  const [formErrors, setFormErrors] = useState<MesaDiretoraFormErrors>({});
  const [formTouched, setFormTouched] = useState<
    Partial<Record<keyof MesaDiretoraForm, boolean>>
  >({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const dialogCargoRequestRef = useRef(0);

  const convencaoOptions = useMemo(
    () => toConvencaoOptions(convencoes),
    [convencoes]
  );
  const filterCargoOptions = useMemo(
    () => toCargoOptions(filterCargos),
    [filterCargos]
  );
  const dialogCargoOptions = useMemo(
    () => toCargoOptions(dialogCargos),
    [dialogCargos]
  );
  const membroOptions = useMemo(
    () => mergeSelectedMembroOption(toMembroOptions(membros), selectedMesa),
    [membros, selectedMesa]
  );
  const hasFilters = Boolean(
    filterConvencaoId || filterMembro.trim() || filterCargoId
  );

  async function loadMesas(nextPage = page, signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);
      const response = await listarMesasDiretoras(
        nextPage,
        pageSize,
        {
          convencaoId: filterConvencaoId,
          nomeMembro: debouncedFilterMembro,
          cargoIdAdministrativo: filterCargoId,
        },
        signal
      );

      setData(response);
      setPage(response.number ?? nextPage);
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return;

      setData(null);
      setError("Não foi possível carregar os membros da Mesa Diretora.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  async function loadDialogCargos(convencaoId: number, signal?: AbortSignal) {
    const requestId = dialogCargoRequestRef.current + 1;
    dialogCargoRequestRef.current = requestId;

    try {
      setDialogCargosLoading(true);
      setDialogCargoError(null);
      const response = await listarCargos(
        0,
        supportPageSize,
        undefined,
        signal,
        {
          convencaoId,
          statusAtivo: true,
        }
      );

      if (dialogCargoRequestRef.current === requestId) {
        setDialogCargos(response.content);
      }
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return;

      if (dialogCargoRequestRef.current === requestId) {
        setDialogCargos([]);
        setDialogCargoError("Não foi possível carregar os cargos.");
      }
    } finally {
      if (!signal?.aborted && dialogCargoRequestRef.current === requestId) {
        setDialogCargosLoading(false);
      }
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFilterMembro(filterMembro.trim());
      setPage(0);
    }, searchDelayMs);

    return () => window.clearTimeout(timeout);
  }, [filterMembro]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedMemberSearch(memberSearch.trim());
    }, searchDelayMs);

    return () => window.clearTimeout(timeout);
  }, [memberSearch]);

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
    void loadMesas(page, controller.signal);
    return () => controller.abort();
  }, [debouncedFilterMembro, filterCargoId, filterConvencaoId, page]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFilterCargos() {
      try {
        setFilterCargosLoading(true);
        const response = await listarCargos(
          0,
          supportPageSize,
          undefined,
          controller.signal,
          {
            convencaoId: filterConvencaoId,
            statusAtivo: true,
          }
        );
        setFilterCargos(response.content);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;
        setFilterCargos([]);
      } finally {
        if (!controller.signal.aborted) {
          setFilterCargosLoading(false);
        }
      }
    }

    void loadFilterCargos();

    return () => controller.abort();
  }, [filterConvencaoId]);

  useEffect(() => {
    if (!dialogOpen) return;

    const controller = new AbortController();

    async function loadMembers() {
      try {
        setMembersLoading(true);
        const response = await listarMembros(
          0,
          memberPageSize,
          { busca: debouncedMemberSearch },
          controller.signal
        );
        setMembros(response.content);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;
        setMembros([]);
      } finally {
        if (!controller.signal.aborted) {
          setMembersLoading(false);
        }
      }
    }

    void loadMembers();

    return () => controller.abort();
  }, [debouncedMemberSearch, dialogOpen]);

  function handleFilterConvencaoChange(convencaoId: number) {
    setFilterConvencaoId(convencaoId);
    setFilterCargoId(undefined);
    setPage(0);
  }

  function clearFilters() {
    setFilterConvencaoId(undefined);
    setFilterMembro("");
    setDebouncedFilterMembro("");
    setFilterCargoId(undefined);
    setPage(0);
  }

  function resetDialog() {
    dialogCargoRequestRef.current += 1;
    setDialogOpen(false);
    setSelectedMesa(null);
    setDialogCargos([]);
    setDialogCargoError(null);
    setMembros([]);
    setMemberSearch("");
    setDebouncedMemberSearch("");
    setForm(initialForm);
    setFormErrors({});
    setFormTouched({});
    setSaving(false);
  }

  function openCreateDialog() {
    setSelectedMesa(null);
    setForm(initialForm);
    setFormErrors({});
    setFormTouched({});
    setDialogCargos([]);
    setDialogCargoError(null);
    setMemberSearch("");
    setDebouncedMemberSearch("");
    setDialogOpen(true);
  }

  function openEditDialog(mesa: MesaDiretora) {
    setSelectedMesa(mesa);
    setForm({
      convencaoId: mesa.convencaoId,
      usuarioId: mesa.usuarioId,
      cargoIdAdministrativo: mesa.cargoIdAdministrativo,
      dataInicial: mesa.dataInicial,
      dataFinal: mesa.dataFinal ?? "",
    });
    setFormErrors({});
    setFormTouched({});
    setMemberSearch(mesa.nomeUsuario);
    setDebouncedMemberSearch(mesa.nomeUsuario);
    setDialogOpen(true);
    void loadDialogCargos(mesa.convencaoId);
  }

  function updateForm<K extends keyof MesaDiretoraForm>(
    field: K,
    value: MesaDiretoraForm[K]
  ) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (formTouched[field]) {
        setFormErrors(validateForm(next));
      }

      return next;
    });
  }

  function touchField(field: keyof MesaDiretoraForm) {
    setFormTouched((current) => ({ ...current, [field]: true }));
    setFormErrors(validateForm(form));
  }

  function handleDialogConvencaoChange(convencaoId: number) {
    setForm((current) => ({
      ...current,
      convencaoId,
      cargoIdAdministrativo: undefined,
    }));
    setDialogCargos([]);
    setDialogCargoError(null);
    void loadDialogCargos(convencaoId);
  }

  async function handleSave() {
    if (saving) return;

    const errors = validateForm(form);
    setFormErrors(errors);
    setFormTouched({
      convencaoId: true,
      usuarioId: true,
      cargoIdAdministrativo: true,
      dataInicial: true,
      dataFinal: true,
    });

    if (hasErrors(errors)) {
      await alerts.warn({ text: "Revise as informações antes de salvar." });
      return;
    }

    try {
      setSaving(true);
      alerts.loading({
        title: selectedMesa ? "Salvando alterações..." : "Adicionando membro...",
      });

      if (selectedMesa) {
        await atualizarMesaDiretora(selectedMesa.mesaDiretoraId, toPayload(form));
      } else {
        await cadastrarMesaDiretora(toPayload(form));
      }

      alerts.close();
      await alerts.success({
        text: selectedMesa
          ? "Membro da Mesa Diretora atualizado com sucesso."
          : "Membro adicionado à Mesa Diretora com sucesso.",
      });

      const nextPage = selectedMesa ? page : 0;
      resetDialog();
      await loadMesas(nextPage);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(mesa: MesaDiretora) {
    if (deletingId) return;

    const confirmed = await alerts.confirm({
      title: "Excluir membro",
      text: "Deseja realmente excluir este membro da Mesa Diretora?",
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setDeletingId(mesa.mesaDiretoraId);
      alerts.loading({ title: "Excluindo membro..." });
      await excluirMesaDiretora(mesa.mesaDiretoraId);
      alerts.close();
      await alerts.success({ text: "Membro excluído da Mesa Diretora." });

      const currentItems = data?.content.length ?? 0;
      const nextPage = currentItems === 1 && page > 0 ? page - 1 : page;
      await loadMesas(nextPage);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setDeletingId(null);
    }
  }

  const mesas = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const dialogTitle = selectedMesa
    ? "Editar membro da Mesa Diretora"
    : "Adicionar membro à Mesa Diretora";
  const dialogSubtitle = selectedMesa
    ? "Atualize o membro, cargo e período de participação na Mesa Diretora."
    : "Defina o membro, cargo e período de participação na Mesa Diretora.";

  return (
    <section className="portal-page comissao-page mesa-page" aria-labelledby="mesa-title">
      <div className="comissao-headerRow">
        <GestaoBackButton />
        <button
          className="comissao-primaryButton"
          type="button"
          onClick={openCreateDialog}
          disabled={supportLoading || !!supportError}
        >
          + Novo membro
        </button>
      </div>

      <header className="portal-pageHeader">
        <h1 id="mesa-title">Mesa Diretora</h1>
        <p>Gerencie os membros e cargos da Mesa Diretora.</p>
      </header>

      <section className="comissao-filterCard mesa-filterCard" aria-label="Filtros da Mesa Diretora">
        <FormField label="Membro">
          <input
            className="vf-input"
            value={filterMembro}
            onChange={(event) => setFilterMembro(event.target.value)}
            placeholder="Buscar membro por nome..."
          />
        </FormField>

        <FormField label="Convenção">
          <DropdownField<number>
            value={filterConvencaoId}
            options={convencaoOptions}
            placeholder={supportLoading ? "Carregando..." : "Todas"}
            searchPlaceholder="Buscar convenção..."
            emptyText={
              supportLoading ? "Carregando convenções..." : "Nenhuma convenção encontrada"
            }
            disabled={supportLoading || !!supportError}
            onChange={handleFilterConvencaoChange}
          />
        </FormField>

        <FormField label="Cargo">
          <DropdownField<number>
            value={filterCargoId}
            options={filterCargoOptions}
            placeholder={filterCargosLoading ? "Carregando..." : "Todos"}
            searchPlaceholder="Buscar cargo..."
            emptyText={
              filterCargosLoading ? "Carregando cargos..." : "Nenhum cargo encontrado"
            }
            disabled={filterCargosLoading}
            onChange={(value) => {
              setFilterCargoId(value);
              setPage(0);
            }}
          />
        </FormField>

        <div className="gestao-filterActions">
          <ClearFiltersButton disabled={!hasFilters} onClick={clearFilters} />
        </div>
      </section>

      {supportError ? (
        <div className="portal-state portal-state--error">{supportError}</div>
      ) : null}

      <section className="identity-tableCard">
        {loading ? (
          <div className="portal-state">Carregando Mesa Diretora...</div>
        ) : error ? (
          <div className="portal-state portal-state--error">{error}</div>
        ) : mesas.length === 0 ? (
          <div className="identity-empty">
            <strong>Nenhum membro da Mesa Diretora encontrado</strong>
            <span>Nenhum membro da Mesa Diretora encontrado para os filtros informados.</span>
          </div>
        ) : (
          <div className="identity-tableWrap">
            <table className="identity-table comissao-table mesa-table">
              <thead>
                <tr>
                  <th>Convenção</th>
                  <th>Membro</th>
                  <th>Cargo</th>
                  <th>Data inicial</th>
                  <th>Data final</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {mesas.map((mesa) => (
                  <tr key={mesa.mesaDiretoraId}>
                    <td>
                      <span className="comissao-convencao">{mesa.nomeConvencao}</span>
                    </td>
                    <td>{mesa.nomeUsuario}</td>
                    <td>{mesa.nomeCargoAdministrativo}</td>
                    <td>{formatDate(mesa.dataInicial)}</td>
                    <td>{formatDate(mesa.dataFinal)}</td>
                    <td>
                      <div className="comissao-actions">
                        <button
                          type="button"
                          title="Editar membro"
                          aria-label={`Editar ${mesa.nomeUsuario}`}
                          onClick={() => openEditDialog(mesa)}
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          title="Excluir membro"
                          aria-label={`Excluir ${mesa.nomeUsuario}`}
                          disabled={deletingId === mesa.mesaDiretoraId}
                          onClick={() => void handleDelete(mesa)}
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
          className="comissao-dialogLayer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mesa-dialog-title"
        >
          <button
            className="comissao-dialogBackdrop"
            type="button"
            aria-label="Fechar"
            onClick={resetDialog}
          />
          <section className="comissao-dialog">
            <header className="comissao-dialogHeader">
              <div className="comissao-dialogTitle">
                <img
                  className="comissao-dialogLogo"
                  src={logoComademat}
                  alt=""
                  aria-hidden="true"
                />
                <div>
                  <h2 id="mesa-dialog-title">{dialogTitle}</h2>
                  <p>{dialogSubtitle}</p>
                </div>
              </div>
              <button type="button" aria-label="Fechar" onClick={resetDialog}>
                ×
              </button>
            </header>

            <div className="comissao-form">
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
                  onChange={handleDialogConvencaoChange}
                  onBlur={() => touchField("convencaoId")}
                  disabled={supportLoading || saving}
                  invalid={!!(formTouched.convencaoId && formErrors.convencaoId)}
                />
              </FormField>

              <FormField
                label="Membro"
                required
                error={formTouched.usuarioId ? formErrors.usuarioId : undefined}
              >
                <DropdownField<number>
                  value={form.usuarioId}
                  options={membroOptions}
                  placeholder="Selecione um membro"
                  searchPlaceholder="Digite nome ou CPF..."
                  emptyText={
                    membersLoading ? "Carregando membros..." : "Nenhum membro encontrado"
                  }
                  onSearchChange={setMemberSearch}
                  onChange={(value) => updateForm("usuarioId", value)}
                  onBlur={() => touchField("usuarioId")}
                  disabled={membersLoading || saving}
                  invalid={!!(formTouched.usuarioId && formErrors.usuarioId)}
                />
              </FormField>

              <FormField
                label="Cargo"
                required
                helperText="Os cargos disponíveis correspondem à Convenção selecionada."
                error={
                  formTouched.cargoIdAdministrativo
                    ? formErrors.cargoIdAdministrativo
                    : undefined
                }
              >
                <DropdownField<number>
                  value={form.cargoIdAdministrativo}
                  options={dialogCargoOptions}
                  placeholder="Selecione um cargo"
                  searchPlaceholder="Buscar cargo..."
                  emptyText={
                    dialogCargosLoading ? "Carregando cargos..." : "Nenhum cargo encontrado"
                  }
                  onChange={(value) => updateForm("cargoIdAdministrativo", value)}
                  onBlur={() => touchField("cargoIdAdministrativo")}
                  disabled={dialogCargosLoading || saving || !form.convencaoId}
                  invalid={
                    !!(
                      formTouched.cargoIdAdministrativo &&
                      formErrors.cargoIdAdministrativo
                    )
                  }
                />
              </FormField>

              {dialogCargoError ? (
                <div className="portal-state portal-state--error">{dialogCargoError}</div>
              ) : null}

              <div className="comissao-formRow">
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
            </div>

            <footer>
              <button type="button" onClick={resetDialog} disabled={saving}>
                Cancelar
              </button>
              <button
                className="comissao-saveButton"
                type="button"
                disabled={saving || dialogCargosLoading}
                onClick={() => void handleSave()}
              >
                {saving ? "Salvando..." : selectedMesa ? "Salvar alterações" : "Salvar"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
