import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  atualizarCamposParticipantesDoEvento,
  buscarCamposParticipantesDoEvento,
  buscarEventoPorId,
  listarCamposEclesiasticosPorRegiao,
  listarRegioesPorConvencao,
  type Evento,
  type SelectOptionDto,
} from "@features/admin/api/eventoApi";
import { GestaoBackButton } from "@features/admin/ui/GestaoPageActions";
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
import "./EventoCamposEclesiasticosPage.css";

type RegionFilter = "all" | number;

type CampoEclesiasticoVisivel = SelectOptionDto & {
  regiaoId: number;
  nomeRegiao: string;
};

function formatDate(value?: string | null) {
  return value ? formatarDataToBr(value) : "—";
}

function areSetsEqual(a: Set<number>, b: Set<number>) {
  if (a.size !== b.size) return false;

  for (const value of a) {
    if (!b.has(value)) return false;
  }

  return true;
}

function toRegionOptions(
  regioes: SelectOptionDto[]
): DropdownOption<RegionFilter>[] {
  return [
    { value: "all", label: "Todas as regiões" },
    ...regioes.map((regiao) => ({
      value: regiao.id,
      label: regiao.nome,
    })),
  ];
}

function mergeUniqueCampos(campos: CampoEclesiasticoVisivel[]) {
  const camposById = new Map<number, CampoEclesiasticoVisivel>();

  campos.forEach((campo) => {
    if (!camposById.has(campo.id)) {
      camposById.set(campo.id, campo);
    }
  });

  return Array.from(camposById.values());
}

export function EventoCamposEclesiasticosPage() {
  const navigate = useNavigate();
  const params = useParams<{ eventoId: string }>();
  const eventoId = Number(params.eventoId);
  const hasValidEventoId = Number.isInteger(eventoId) && eventoId > 0;
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const [evento, setEvento] = useState<Evento | null>(null);
  const [regioes, setRegioes] = useState<SelectOptionDto[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>("all");
  const [campos, setCampos] = useState<CampoEclesiasticoVisivel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<number>>(
    () => new Set()
  );
  const [loading, setLoading] = useState(true);
  const [camposLoading, setCamposLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [camposError, setCamposError] = useState<string | null>(null);

  const regionOptions = useMemo(() => toRegionOptions(regioes), [regioes]);
  const selectedCount = selectedIds.size;
  const hasChanges = useMemo(
    () => !areSetsEqual(selectedIds, initialSelectedIds),
    [initialSelectedIds, selectedIds]
  );
  const visibleIds = useMemo(() => campos.map((campo) => campo.id), [campos]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));
  const periodLabel = evento
    ? `${formatDate(evento.dataInicial)} a ${formatDate(evento.dataFinal)}`
    : "—";
  const selectedCountLabel =
    selectedCount === 1
      ? "1 campo selecionado"
      : `${selectedCount} campos selecionados`;

  const groupedCampos = useMemo(() => {
    const groups = new Map<string, CampoEclesiasticoVisivel[]>();

    campos.forEach((campo) => {
      const current = groups.get(campo.nomeRegiao) ?? [];
      current.push(campo);
      groups.set(campo.nomeRegiao, current);
    });

    return Array.from(groups.entries()).map(([nomeRegiao, itens]) => ({
      nomeRegiao,
      campos: itens,
    }));
  }, [campos]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        someVisibleSelected && !allVisibleSelected;
    }
  }, [allVisibleSelected, someVisibleSelected]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialData() {
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
        const [participantesResponse, regioesResponse] = await Promise.all([
          buscarCamposParticipantesDoEvento(eventoId, controller.signal),
          listarRegioesPorConvencao(
            eventoResponse.convencaoId,
            controller.signal
          ),
        ]);
        const participantes = new Set(
          participantesResponse.campoEclesiasticoIds
        );

        setEvento(eventoResponse);
        setRegioes(regioesResponse);
        setSelectedRegion("all");
        setSelectedIds(participantes);
        setInitialSelectedIds(new Set(participantes));
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setEvento(null);
        setRegioes([]);
        setSelectedIds(new Set());
        setInitialSelectedIds(new Set());
        setError(handleAxiosError(requestError));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => controller.abort();
  }, [eventoId, hasValidEventoId]);

  useEffect(() => {
    if (!evento) {
      setCampos([]);
      return;
    }

    const controller = new AbortController();

    async function loadCampos() {
      try {
        setCamposLoading(true);
        setCamposError(null);

        if (regioes.length === 0) {
          setCampos([]);
          return;
        }

        if (selectedRegion === "all") {
          const camposPorRegiao = await Promise.all(
            regioes.map(async (regiao) => {
              const response = await listarCamposEclesiasticosPorRegiao(
                regiao.id,
                controller.signal
              );

              return response.map((campo) => ({
                ...campo,
                regiaoId: regiao.id,
                nomeRegiao: regiao.nome,
              }));
            })
          );

          setCampos(mergeUniqueCampos(camposPorRegiao.flat()));
          return;
        }

        const regiao = regioes.find((item) => item.id === selectedRegion);

        if (!regiao) {
          setCampos([]);
          return;
        }

        const response = await listarCamposEclesiasticosPorRegiao(
          regiao.id,
          controller.signal
        );

        setCampos(
          response.map((campo) => ({
            ...campo,
            regiaoId: regiao.id,
            nomeRegiao: regiao.nome,
          }))
        );
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setCampos([]);
        setCamposError(handleAxiosError(requestError));
      } finally {
        if (!controller.signal.aborted) {
          setCamposLoading(false);
        }
      }
    }

    void loadCampos();

    return () => controller.abort();
  }, [evento, regioes, selectedRegion]);

  function toggleCampo(campoId: number, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(campoId);
      } else {
        next.delete(campoId);
      }

      return next;
    });
  }

  function toggleVisibleCampos(checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);

      visibleIds.forEach((id) => {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });

      return next;
    });
  }

  async function handleSave() {
    if (!evento || saving || !hasChanges) return;

    try {
      setSaving(true);
      alerts.loading({ title: "Salvando participantes..." });

      const ids = Array.from(selectedIds).sort((a, b) => a - b);
      await atualizarCamposParticipantesDoEvento(evento.eventoId, ids);

      alerts.close();
      setInitialSelectedIds(new Set(ids));
      await alerts.success({
        text: "Campos eclesiásticos participantes atualizados com sucesso.",
      });
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSaving(false);
    }
  }

  function renderCampo(campo: CampoEclesiasticoVisivel) {
    const checked = selectedIds.has(campo.id);

    return (
      <label className="evento-campos-item" key={campo.id}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => toggleCampo(campo.id, event.target.checked)}
          disabled={saving}
        />
        <span>
          <strong>{campo.nome}</strong>
          <em>{campo.nomeRegiao}</em>
        </span>
      </label>
    );
  }

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

          <section className="evento-campos-filterCard" aria-label="Filtro de região">
            <FormField label="Região">
              <DropdownField<RegionFilter>
                value={selectedRegion}
                options={regionOptions}
                placeholder="Todas as regiões"
                searchPlaceholder="Buscar região..."
                emptyText="Nenhuma região encontrada"
                disabled={regioes.length === 0 || saving}
                onChange={setSelectedRegion}
              />
            </FormField>
          </section>

          <section className="evento-campos-listCard">
            <div className="evento-campos-listHeader">
              <label className="evento-campos-selectAll">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allVisibleSelected}
                  disabled={campos.length === 0 || saving || camposLoading}
                  onChange={(event) =>
                    toggleVisibleCampos(event.target.checked)
                  }
                />
                <span>Selecionar todos</span>
              </label>
              <strong>{selectedCountLabel}</strong>
            </div>

            {camposLoading ? (
              <div className="portal-state">Carregando campos...</div>
            ) : camposError ? (
              <div className="portal-state portal-state--error">{camposError}</div>
            ) : regioes.length === 0 ? (
              <div className="identity-empty">
                <strong>Nenhuma região encontrada para esta convenção.</strong>
              </div>
            ) : campos.length === 0 ? (
              <div className="identity-empty">
                <strong>
                  {selectedRegion === "all"
                    ? "Nenhum campo eclesiástico encontrado para esta convenção."
                    : "Nenhum campo eclesiástico encontrado para esta região."}
                </strong>
              </div>
            ) : selectedRegion === "all" ? (
              <div className="evento-campos-groups">
                {groupedCampos.map((group) => (
                  <section key={group.nomeRegiao} className="evento-campos-group">
                    <h2>{group.nomeRegiao}</h2>
                    <div>{group.campos.map(renderCampo)}</div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="evento-campos-singleList">
                {campos.map(renderCampo)}
              </div>
            )}

            <footer className="evento-campos-footer">
              <span>{selectedCountLabel}</span>
              <div>
                <button
                  type="button"
                  onClick={() => navigate("/processo-eleitoral/eventos")}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className="evento-campos-saveButton"
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || !hasChanges}
                >
                  {saving ? "Salvando..." : "Salvar participantes"}
                </button>
              </div>
            </footer>
          </section>
        </>
      ) : null}
    </section>
  );
}
