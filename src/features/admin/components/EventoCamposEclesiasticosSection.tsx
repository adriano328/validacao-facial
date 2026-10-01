import { useEffect, useMemo, useRef, useState } from "react";
import {
  atualizarCamposParticipantesDoEvento,
  buscarCamposParticipantesDoEvento,
  listarCamposEclesiasticosPorRegiao,
  listarRegioesPorConvencao,
  type Evento,
  type SelectOptionDto,
} from "@features/admin/api/eventoApi";
import { alerts } from "@shared/lib/swal";
import {
  DropdownField,
  type DropdownOption,
} from "@shared/ui/dropdown/DropdownField";
import { FormField } from "@shared/ui/form/FormField";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import "@features/admin/pages/EventoCamposEclesiasticosPage.css";

type RegionFilter = "all" | number;

type CampoEclesiasticoVisivel = SelectOptionDto & {
  regiaoId: number;
  nomeRegiao: string;
};

type EventoCamposEclesiasticosSectionProps = {
  evento: Evento;
  onCancel?: () => void;
};

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

export function EventoCamposEclesiasticosSection({
  evento,
  onCancel,
}: EventoCamposEclesiasticosSectionProps) {
  const selectAllRef = useRef<HTMLInputElement | null>(null);

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
      try {
        setLoading(true);
        setError(null);

        const [participantesResponse, regioesResponse] = await Promise.all([
          buscarCamposParticipantesDoEvento(evento.eventoId, controller.signal),
          listarRegioesPorConvencao(evento.convencaoId, controller.signal),
        ]);
        const participantes = new Set(
          participantesResponse.campoEclesiasticoIds
        );

        setRegioes(regioesResponse);
        setSelectedRegion("all");
        setSelectedIds(participantes);
        setInitialSelectedIds(new Set(participantes));
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

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
  }, [evento.convencaoId, evento.eventoId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCampos() {
      try {
        setCamposLoading(true);
        setCamposError(null);

        if (regioes.length === 0) {
          setCampos([]);
          setSelectedIds(new Set());
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

          const mergedCampos = mergeUniqueCampos(camposPorRegiao.flat());
          const availableIds = new Set(mergedCampos.map((campo) => campo.id));

          setCampos(mergedCampos);
          setSelectedIds((current) => {
            const next = new Set<number>();

            current.forEach((id) => {
              if (availableIds.has(id)) {
                next.add(id);
              }
            });

            return next;
          });
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

    if (loading) {
      setCampos([]);
      return () => controller.abort();
    }

    void loadCampos();

    return () => controller.abort();
  }, [loading, regioes, selectedRegion]);

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

  function handleCancel() {
    if (onCancel) {
      onCancel();
      return;
    }

    setSelectedIds(new Set(initialSelectedIds));
  }

  async function handleSave() {
    if (saving || !hasChanges) return;

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

  if (loading) {
    return <div className="portal-state">Carregando campos participantes...</div>;
  }

  if (error) {
    return <div className="portal-state portal-state--error">{error}</div>;
  }

  return (
    <>
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
              onChange={(event) => toggleVisibleCampos(event.target.checked)}
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
              onClick={handleCancel}
              disabled={saving || (!onCancel && !hasChanges)}
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
  );
}
