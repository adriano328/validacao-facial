import { useEffect, useMemo, useState } from "react";
import {
  atualizarCargo,
  cadastrarCargo,
  excluirCargo,
  listarCargos,
  listarTiposCargo,
  type CargoPayload,
  type CargoResponse,
  type PageResponse,
  type TipoCargo,
} from "@features/admin/api/cargoApi";
import {
  listarConvencoes,
  type Convencao,
} from "@features/admin/api/convencaoApi";
import {
  ClearFiltersButton,
  GestaoBackButton,
} from "@features/admin/ui/GestaoPageActions";
import { alerts } from "@shared/lib/swal";
import { DropdownField } from "@shared/ui/dropdown/DropdownField";
import { FormField } from "@shared/ui/form/FormField";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import "@features/user/pages/HomePage.css";
import "./CargosPage.css";

const pageSize = 10;
const searchDelayMs = 350;

type CargoForm = {
  convencaoId?: number;
  nomeCargo: string;
  tipoCargo?: number;
  statusAtivo: boolean;
};

type CargoFormErrors = Partial<Record<keyof CargoForm, string>>;

const initialForm: CargoForm = {
  nomeCargo: "",
  statusAtivo: true,
};

function validateForm(form: CargoForm): CargoFormErrors {
  const errors: CargoFormErrors = {};
  const nomeCargo = form.nomeCargo.trim();

  if (!form.convencaoId) {
    errors.convencaoId = "A convenção é obrigatória.";
  }

  if (!nomeCargo) {
    errors.nomeCargo = "O nome do cargo é obrigatório.";
  } else if (nomeCargo.length > 100) {
    errors.nomeCargo = "O nome do cargo deve possuir no máximo 100 caracteres.";
  }

  if (!form.tipoCargo) {
    errors.tipoCargo = "O tipo do cargo é obrigatório.";
  }

  if (typeof form.statusAtivo !== "boolean") {
    errors.statusAtivo = "O status é obrigatório.";
  }

  return errors;
}

function hasErrors(errors: CargoFormErrors) {
  return Object.values(errors).some(Boolean);
}

function toPayload(form: CargoForm): CargoPayload {
  return {
    convencaoId: form.convencaoId!,
    nomeCargo: form.nomeCargo.trim(),
    statusAtivo: form.statusAtivo,
    tipoCargo: form.tipoCargo!,
  };
}

function getTipoClass(descricao?: string | null) {
  return String(descricao ?? "tipo")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

export function CargosPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<CargoResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [convencoes, setConvencoes] = useState<Convencao[]>([]);
  const [tiposCargo, setTiposCargo] = useState<TipoCargo[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCargoId, setEditingCargoId] = useState<number | null>(null);
  const [form, setForm] = useState<CargoForm>(initialForm);
  const [formErrors, setFormErrors] = useState<CargoFormErrors>({});
  const [formTouched, setFormTouched] = useState<Partial<Record<keyof CargoForm, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [deletingCargoId, setDeletingCargoId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, searchDelayMs);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCargos() {
      try {
        setLoading(true);
        setError(null);
        const response = await listarCargos(
          page,
          pageSize,
          debouncedSearch,
          controller.signal
        );
        setData(response);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setData(null);
        setError("Não foi possível carregar os cargos.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCargos();

    return () => controller.abort();
  }, [debouncedSearch, page]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSupportData() {
      try {
        setSupportLoading(true);
        setSupportError(null);
        const [convencoesResponse, tiposResponse] = await Promise.all([
          listarConvencoes(controller.signal),
          listarTiposCargo(controller.signal),
        ]);

        setConvencoes(convencoesResponse);
        setTiposCargo(tiposResponse);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setConvencoes([]);
        setTiposCargo([]);
        setSupportError("Não foi possível carregar convenções e tipos de cargo.");
      } finally {
        if (!controller.signal.aborted) {
          setSupportLoading(false);
        }
      }
    }

    void loadSupportData();

    return () => controller.abort();
  }, []);

  const convencaoOptions = useMemo(
    () =>
      convencoes.map((convencao) => ({
        value: convencao.convencaoId,
        label: convencao.nomeConvencao,
      })),
    [convencoes]
  );

  const tipoOptions = useMemo(
    () =>
      tiposCargo.map((tipo) => ({
        value: tipo.codigo,
        label: tipo.descricao,
      })),
    [tiposCargo]
  );

  async function reloadCurrentPage(nextPage = page) {
    try {
      setLoading(true);
      setError(null);
      const response = await listarCargos(nextPage, pageSize, debouncedSearch);
      setData(response);
      setPage(nextPage);
    } catch {
      setData(null);
      setError("Não foi possível carregar os cargos.");
    } finally {
      setLoading(false);
    }
  }

  function resetDialog() {
    setDialogOpen(false);
    setEditingCargoId(null);
    setForm(initialForm);
    setFormErrors({});
    setFormTouched({});
    setSaving(false);
  }

  function openCreateDialog() {
    setEditingCargoId(null);
    setForm(initialForm);
    setFormErrors({});
    setFormTouched({});
    setDialogOpen(true);
  }

  function openEditDialog(cargo: CargoResponse) {
    setDialogOpen(true);
    setEditingCargoId(cargo.cargoId);
    setForm({
      convencaoId: cargo.convencaoId,
      nomeCargo: cargo.nomeCargo ?? "",
      tipoCargo: cargo.tipoCargo,
      statusAtivo: Boolean(cargo.statusAtivo),
    });
    setFormErrors({});
    setFormTouched({});
  }

  function clearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setPage(0);
  }

  function updateForm<K extends keyof CargoForm>(field: K, value: CargoForm[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (formTouched[field]) {
        setFormErrors(validateForm(next));
      }

      return next;
    });
  }

  function touchField(field: keyof CargoForm) {
    setFormTouched((current) => ({ ...current, [field]: true }));
    setFormErrors(validateForm(form));
  }

  async function handleSave() {
    if (saving) return;

    const errors = validateForm(form);
    setFormErrors(errors);
    setFormTouched({
      convencaoId: true,
      nomeCargo: true,
      tipoCargo: true,
      statusAtivo: true,
    });

    if (hasErrors(errors)) {
      await alerts.warn({ text: "Revise as informações antes de salvar." });
      return;
    }

    try {
      setSaving(true);
      alerts.loading({
        title: editingCargoId ? "Salvando alterações..." : "Cadastrando cargo...",
      });

      if (editingCargoId) {
        await atualizarCargo(editingCargoId, toPayload(form));
      } else {
        await cadastrarCargo(toPayload(form));
      }

      alerts.close();
      await alerts.success({
        text: editingCargoId
          ? "Cargo atualizado com sucesso."
          : "Cargo cadastrado com sucesso.",
      });

      resetDialog();
      await reloadCurrentPage(editingCargoId ? page : 0);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cargo: CargoResponse) {
    if (deletingCargoId) return;

    const confirmed = await alerts.confirm({
      title: "Excluir cargo",
      text: `Tem certeza que deseja excluir o cargo "${cargo.nomeCargo}"?`,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setDeletingCargoId(cargo.cargoId);
      alerts.loading({ title: "Excluindo cargo..." });
      await excluirCargo(cargo.cargoId);
      alerts.close();
      await alerts.success({ text: "Cargo excluído com sucesso." });

      const currentItems = data?.content.length ?? 0;
      const nextPage = currentItems === 1 && page > 0 ? page - 1 : page;
      await reloadCurrentPage(nextPage);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setDeletingCargoId(null);
    }
  }

  const cargos = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const dialogTitle = editingCargoId ? "Editar cargo" : "Cadastrar cargo";
  const saveText = editingCargoId ? "Salvar alterações" : "Salvar cargo";
  const loadingSelects = supportLoading;
  const hasFilters = Boolean(search.trim());

  return (
    <section className="portal-page cargos-page" aria-labelledby="cargos-title">
      <GestaoBackButton />

      <header className="portal-pageHeader">
        <h1 id="cargos-title">Gestão de Cargos</h1>
        <p>Gerencie os cargos disponíveis nas convenções.</p>
      </header>

      <section className="cargos-toolbar" aria-label="Filtros de cargos">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar cargo pelo nome..."
        />
        <button
          type="button"
          onClick={openCreateDialog}
          disabled={supportLoading || !!supportError}
        >
          + Novo cargo
        </button>
        <div className="gestao-filterActions">
          <ClearFiltersButton
            disabled={!hasFilters}
            onClick={clearFilters}
          />
        </div>
      </section>

      {supportError ? (
        <div className="portal-state portal-state--error">{supportError}</div>
      ) : null}

      <section className="cargos-tableCard">
        {loading ? (
          <div className="portal-state">Carregando cargos...</div>
        ) : error ? (
          <div className="portal-state portal-state--error">{error}</div>
        ) : cargos.length === 0 ? (
          <div className="cargos-empty">
            <strong>Nenhum cargo encontrado</strong>
            <span>
              {debouncedSearch
                ? "Nenhum cargo encontrado para a pesquisa informada."
                : "Cadastre um novo cargo para começar."}
            </span>
          </div>
        ) : (
          <div className="cargos-tableWrap">
            <table className="cargos-table">
              <thead>
                <tr>
                  <th>Nome do Cargo</th>
                  <th>Situação</th>
                  <th>Tipo de Cargo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cargos.map((cargo) => (
                  <tr key={cargo.cargoId}>
                    <td>
                      <span className="cargos-name">{cargo.nomeCargo}</span>
                    </td>
                    <td>
                      <span
                        className={`portal-badge portal-badge--${
                          cargo.statusAtivo ? "ativo" : "reprovado"
                        }`}
                      >
                        {cargo.statusAtivo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <span className={`cargos-type is-${getTipoClass(cargo.descricaoTipoCargo)}`}>
                        {cargo.descricaoTipoCargo}
                      </span>
                    </td>
                    <td>
                      <div className="cargos-actions">
                        <button
                          type="button"
                          title="Editar cargo"
                          aria-label={`Editar cargo ${cargo.nomeCargo}`}
                          onClick={() => openEditDialog(cargo)}
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          title="Excluir cargo"
                          aria-label={`Excluir cargo ${cargo.nomeCargo}`}
                          disabled={deletingCargoId === cargo.cargoId}
                          onClick={() => void handleDelete(cargo)}
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

        <footer className="cargos-pagination">
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
        <div className="cargos-dialogLayer" role="dialog" aria-modal="true" aria-labelledby="cargo-dialog-title">
          <button
            className="cargos-dialogBackdrop"
            type="button"
            aria-label="Fechar"
            onClick={resetDialog}
          />
          <section className="cargos-dialog">
            <header>
              <h2 id="cargo-dialog-title">{dialogTitle}</h2>
              <button type="button" aria-label="Fechar" onClick={resetDialog}>
                ×
              </button>
            </header>

            <div className="cargos-form">
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
                    supportLoading ? "Carregando convenções..." : "Nenhuma convenção encontrada"
                  }
                  onChange={(value) => updateForm("convencaoId", value)}
                  onBlur={() => touchField("convencaoId")}
                  disabled={loadingSelects || saving}
                  invalid={!!(formTouched.convencaoId && formErrors.convencaoId)}
                />
              </FormField>

              <FormField
                label="Nome do cargo"
                required
                error={formTouched.nomeCargo ? formErrors.nomeCargo : undefined}
              >
                <input
                  className="vf-input"
                  value={form.nomeCargo}
                  maxLength={100}
                  onChange={(event) => updateForm("nomeCargo", event.target.value)}
                  onBlur={() => touchField("nomeCargo")}
                  disabled={saving}
                  aria-invalid={!!(formTouched.nomeCargo && formErrors.nomeCargo)}
                />
              </FormField>

              <div className="cargos-formRow">
                <FormField
                  label="Tipo de cargo"
                  required
                  error={formTouched.tipoCargo ? formErrors.tipoCargo : undefined}
                >
                  <DropdownField<number>
                    value={form.tipoCargo}
                    options={tipoOptions}
                    placeholder="Selecione o tipo"
                    searchPlaceholder="Buscar tipo..."
                    emptyText={
                      supportLoading ? "Carregando tipos..." : "Nenhum tipo encontrado"
                    }
                    onChange={(value) => updateForm("tipoCargo", value)}
                    onBlur={() => touchField("tipoCargo")}
                    disabled={loadingSelects || saving}
                    invalid={!!(formTouched.tipoCargo && formErrors.tipoCargo)}
                  />
                </FormField>

                <div className="cargos-statusField">
                  <span>Status</span>
                  <label className="cargos-switch">
                    <input
                      type="checkbox"
                      checked={form.statusAtivo}
                      onChange={(event) => updateForm("statusAtivo", event.target.checked)}
                      disabled={saving}
                    />
                    <span aria-hidden />
                    <em>{form.statusAtivo ? "Ativo" : "Inativo"}</em>
                  </label>
                </div>
              </div>
            </div>

            <footer>
              <button type="button" onClick={resetDialog} disabled={saving}>
                Cancelar
              </button>
              <button
                className="cargos-saveButton"
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
