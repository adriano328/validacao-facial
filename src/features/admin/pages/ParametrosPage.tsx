import { useEffect, useMemo, useRef, useState } from "react";
import {
  atualizarParametro,
  listarParametros,
  type Parametro,
  type ParametroUpdateRequest,
} from "@features/admin/api/parametroApi";
import {
  listarCargos,
  type CargoResponse,
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
import {
  DropdownField,
  type DropdownOption,
} from "@shared/ui/dropdown/DropdownField";
import { FormField } from "@shared/ui/form/FormField";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import logoComademat from "@shared/assets/comademat-logo.png";
import "@features/user/pages/HomePage.css";
import "./ParametrosPage.css";

const cargosPageSize = 500;
const genericCargoFilterSupported = false;

type ParametroForm = Partial<ParametroUpdateRequest>;
type ParametroFormErrors = Partial<Record<keyof ParametroUpdateRequest, string>>;

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 17.3V20h2.7L17.8 8.9l-2.7-2.7L4 17.3Zm15.9-10.5a1 1 0 0 0 0-1.4l-1.3-1.3a1 1 0 0 0-1.4 0L16 5.3 18.7 8l1.2-1.2Z" />
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

function validateForm(form: ParametroForm): ParametroFormErrors {
  const errors: ParametroFormErrors = {};

  if (!form.convencaoId) {
    errors.convencaoId = "A convenção é obrigatória.";
  }

  if (!form.cargoIdPresidenteCpe) {
    errors.cargoIdPresidenteCpe = "O Presidente CPE é obrigatório.";
  }

  if (!form.cargoIdSecretarioCpe) {
    errors.cargoIdSecretarioCpe = "O Secretário CPE é obrigatório.";
  }

  if (!form.cargoIdMembroCpe) {
    errors.cargoIdMembroCpe = "O Membro CPE é obrigatório.";
  }

  return errors;
}

function hasErrors(errors: ParametroFormErrors) {
  return Object.values(errors).some(Boolean);
}

function toPayload(form: ParametroForm): ParametroUpdateRequest {
  return {
    convencaoId: form.convencaoId!,
    cargoIdPresidenteCpe: form.cargoIdPresidenteCpe!,
    cargoIdSecretarioCpe: form.cargoIdSecretarioCpe!,
    cargoIdMembroCpe: form.cargoIdMembroCpe!,
  };
}

export function ParametrosPage() {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [convencoes, setConvencoes] = useState<Convencao[]>([]);
  const [filterConvencaoId, setFilterConvencaoId] = useState<number | undefined>();
  const [filterCargoId, setFilterCargoId] = useState<number | undefined>();
  const [filterCargos, setFilterCargos] = useState<CargoResponse[]>([]);
  const [filterCargosLoading, setFilterCargosLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedParametro, setSelectedParametro] = useState<Parametro | null>(null);
  const [dialogCargos, setDialogCargos] = useState<CargoResponse[]>([]);
  const [dialogCargosLoading, setDialogCargosLoading] = useState(false);
  const [dialogCargoError, setDialogCargoError] = useState<string | null>(null);
  const [form, setForm] = useState<ParametroForm>({});
  const [formErrors, setFormErrors] = useState<ParametroFormErrors>({});
  const [formTouched, setFormTouched] = useState<
    Partial<Record<keyof ParametroUpdateRequest, boolean>>
  >({});
  const [saving, setSaving] = useState(false);
  const dialogCargoRequestRef = useRef(0);

  const convencaoOptions = useMemo(() => toConvencaoOptions(convencoes), [convencoes]);
  const filterCargoOptions = useMemo(() => toCargoOptions(filterCargos), [filterCargos]);
  const dialogCargoOptions = useMemo(() => toCargoOptions(dialogCargos), [dialogCargos]);
  const hasFilters = Boolean(filterConvencaoId || filterCargoId);

  async function loadParametros(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);
      const response = await listarParametros(
        {
          convencaoId: filterConvencaoId,
        },
        signal
      );
      setParametros(response);
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return;

      setParametros([]);
      setError("Não foi possível carregar os parâmetros.");
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
      setDialogCargos([]);
      const response = await listarCargos(
        0,
        cargosPageSize,
        undefined,
        signal,
        { convencaoId, statusAtivo: true }
      );

      if (dialogCargoRequestRef.current === requestId) {
        setDialogCargos(response.content);
      }
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return;

      if (dialogCargoRequestRef.current === requestId) {
        setDialogCargos([]);
        setDialogCargoError("Não foi possível carregar os cargos da convenção.");
      }
    } finally {
      if (!signal?.aborted && dialogCargoRequestRef.current === requestId) {
        setDialogCargosLoading(false);
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
    void loadParametros(controller.signal);
    return () => controller.abort();
  }, [filterConvencaoId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFilterCargos() {
      try {
        setFilterCargosLoading(true);
        const response = await listarCargos(
          0,
          cargosPageSize,
          undefined,
          controller.signal,
          { convencaoId: filterConvencaoId, statusAtivo: true }
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

  function handleFilterConvencaoChange(convencaoId: number) {
    setFilterConvencaoId(convencaoId);
    setFilterCargoId(undefined);
  }

  function clearFilters() {
    setFilterConvencaoId(undefined);
    setFilterCargoId(undefined);
  }

  function resetDialog() {
    dialogCargoRequestRef.current += 1;
    setDialogOpen(false);
    setSelectedParametro(null);
    setDialogCargos([]);
    setDialogCargoError(null);
    setForm({});
    setFormErrors({});
    setFormTouched({});
    setSaving(false);
  }

  function openEditDialog(parametro: Parametro) {
    const nextForm = {
      convencaoId: parametro.convencaoId,
      cargoIdPresidenteCpe: parametro.cargoIdPresidenteCpe,
      cargoIdSecretarioCpe: parametro.cargoIdSecretarioCpe,
      cargoIdMembroCpe: parametro.cargoIdMembroCpe,
    };

    setSelectedParametro(parametro);
    setForm(nextForm);
    setFormErrors({});
    setFormTouched({});
    setDialogOpen(true);
    void loadDialogCargos(parametro.convencaoId);
  }

  function updateForm<K extends keyof ParametroUpdateRequest>(
    field: K,
    value: ParametroUpdateRequest[K]
  ) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (formTouched[field]) {
        setFormErrors(validateForm(next));
      }

      return next;
    });
  }

  function touchField(field: keyof ParametroUpdateRequest) {
    setFormTouched((current) => ({ ...current, [field]: true }));
    setFormErrors(validateForm(form));
  }

  function handleDialogConvencaoChange(convencaoId: number) {
    setForm({
      convencaoId,
      cargoIdPresidenteCpe: undefined,
      cargoIdSecretarioCpe: undefined,
      cargoIdMembroCpe: undefined,
    });
    setFormErrors({});
    setDialogCargos([]);
    void loadDialogCargos(convencaoId);
  }

  async function handleSave() {
    if (!selectedParametro || saving) return;

    const errors = validateForm(form);
    setFormErrors(errors);
    setFormTouched({
      convencaoId: true,
      cargoIdPresidenteCpe: true,
      cargoIdSecretarioCpe: true,
      cargoIdMembroCpe: true,
    });

    if (hasErrors(errors)) {
      await alerts.warn({ text: "Revise as informações antes de salvar." });
      return;
    }

    try {
      setSaving(true);
      alerts.loading({ title: "Salvando alterações..." });
      await atualizarParametro(selectedParametro.parametroId, toPayload(form));
      alerts.close();
      await alerts.success({ text: "Parâmetros atualizados com sucesso." });
      resetDialog();
      await loadParametros();
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="portal-page parametros-page" aria-labelledby="parametros-title">
      <GestaoBackButton />

      <header className="portal-pageHeader">
        <h1 id="parametros-title">Parâmetros</h1>
        <p>Consulte e configure os cargos da CPE por convenção.</p>
      </header>

      <section className="parametros-filterCard" aria-label="Filtros de parâmetros">
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
            disabled={!genericCargoFilterSupported || filterCargosLoading}
            onChange={setFilterCargoId}
          />
        </FormField>

        <div className="gestao-filterActions">
          <ClearFiltersButton disabled={!hasFilters} onClick={clearFilters} />
        </div>
      </section>

      {supportError ? (
        <div className="portal-state portal-state--error">{supportError}</div>
      ) : null}

      <section className="parametros-tableCard">
        {loading ? (
          <div className="portal-state">Carregando parâmetros...</div>
        ) : error ? (
          <div className="portal-state portal-state--error">{error}</div>
        ) : parametros.length === 0 ? (
          <div className="parametros-empty">
            <strong>Nenhum parâmetro encontrado</strong>
            <span>Nenhum parâmetro encontrado para os filtros informados.</span>
          </div>
        ) : (
          <div className="parametros-tableWrap">
            <table className="parametros-table">
              <thead>
                <tr>
                  <th>Convenção</th>
                  <th>Presidente CPE</th>
                  <th>Secretário CPE</th>
                  <th>Membro CPE</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {parametros.map((parametro) => (
                  <tr key={parametro.parametroId}>
                    <td>
                      <span className="parametros-name">
                        {parametro.nomeConvencao}
                      </span>
                    </td>
                    <td>{parametro.nomeCargoPresidenteCpe}</td>
                    <td>{parametro.nomeCargoSecretarioCpe}</td>
                    <td>{parametro.nomeCargoMembroCpe}</td>
                    <td>
                      <div className="parametros-actions">
                        <button
                          type="button"
                          title="Editar parâmetros"
                          aria-label={`Editar parâmetros de ${parametro.nomeConvencao}`}
                          onClick={() => openEditDialog(parametro)}
                        >
                          <EditIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error ? (
          <footer className="parametros-footer">
            {parametros.length}{" "}
            {parametros.length === 1
              ? "parâmetro encontrado"
              : "parâmetros encontrados"}
          </footer>
        ) : null}
      </section>

      {dialogOpen ? (
        <div
          className="parametros-dialogLayer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parametros-dialog-title"
        >
          <button
            className="parametros-dialogBackdrop"
            type="button"
            aria-label="Fechar"
            onClick={resetDialog}
          />
          <section className="parametros-dialog">
            <header className="parametros-dialogHeader">
              <div className="parametros-dialogTitle">
                <img
                  className="parametros-dialogLogo"
                  src={logoComademat}
                  alt=""
                  aria-hidden="true"
                />
                <div>
                  <h2 id="parametros-dialog-title">Editar parâmetros</h2>
                  <p>Configure a convenção e os cargos responsáveis pelas funções da CPE.</p>
                </div>
              </div>
              <button type="button" aria-label="Fechar" onClick={resetDialog}>
                ×
              </button>
            </header>

            <div className="parametros-form">
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
                label="Presidente CPE"
                required
                error={
                  formTouched.cargoIdPresidenteCpe
                    ? formErrors.cargoIdPresidenteCpe
                    : undefined
                }
              >
                <DropdownField<number>
                  value={form.cargoIdPresidenteCpe}
                  options={dialogCargoOptions}
                  placeholder="Selecione o cargo"
                  searchPlaceholder="Buscar cargo..."
                  emptyText={
                    dialogCargosLoading ? "Carregando cargos..." : "Nenhum cargo encontrado"
                  }
                  onChange={(value) => updateForm("cargoIdPresidenteCpe", value)}
                  onBlur={() => touchField("cargoIdPresidenteCpe")}
                  disabled={dialogCargosLoading || saving || !form.convencaoId}
                  invalid={
                    !!(
                      formTouched.cargoIdPresidenteCpe &&
                      formErrors.cargoIdPresidenteCpe
                    )
                  }
                />
              </FormField>

              <FormField
                label="Secretário CPE"
                required
                error={
                  formTouched.cargoIdSecretarioCpe
                    ? formErrors.cargoIdSecretarioCpe
                    : undefined
                }
              >
                <DropdownField<number>
                  value={form.cargoIdSecretarioCpe}
                  options={dialogCargoOptions}
                  placeholder="Selecione o cargo"
                  searchPlaceholder="Buscar cargo..."
                  emptyText={
                    dialogCargosLoading ? "Carregando cargos..." : "Nenhum cargo encontrado"
                  }
                  onChange={(value) => updateForm("cargoIdSecretarioCpe", value)}
                  onBlur={() => touchField("cargoIdSecretarioCpe")}
                  disabled={dialogCargosLoading || saving || !form.convencaoId}
                  invalid={
                    !!(
                      formTouched.cargoIdSecretarioCpe &&
                      formErrors.cargoIdSecretarioCpe
                    )
                  }
                />
              </FormField>

              <FormField
                label="Membro CPE"
                required
                error={
                  formTouched.cargoIdMembroCpe
                    ? formErrors.cargoIdMembroCpe
                    : undefined
                }
              >
                <DropdownField<number>
                  value={form.cargoIdMembroCpe}
                  options={dialogCargoOptions}
                  placeholder="Selecione o cargo"
                  searchPlaceholder="Buscar cargo..."
                  emptyText={
                    dialogCargosLoading ? "Carregando cargos..." : "Nenhum cargo encontrado"
                  }
                  onChange={(value) => updateForm("cargoIdMembroCpe", value)}
                  onBlur={() => touchField("cargoIdMembroCpe")}
                  disabled={dialogCargosLoading || saving || !form.convencaoId}
                  invalid={
                    !!(formTouched.cargoIdMembroCpe && formErrors.cargoIdMembroCpe)
                  }
                />
              </FormField>

              {dialogCargoError ? (
                <div className="portal-state portal-state--error">{dialogCargoError}</div>
              ) : null}

              <span className="parametros-helpText">
                <span aria-hidden="true">i</span>
                Ao alterar a Convenção, os cargos disponíveis serão atualizados.
              </span>
            </div>

            <footer>
              <button type="button" onClick={resetDialog} disabled={saving}>
                Cancelar
              </button>
              <button
                className="parametros-saveButton"
                type="button"
                disabled={saving || dialogCargosLoading}
                onClick={() => void handleSave()}
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
