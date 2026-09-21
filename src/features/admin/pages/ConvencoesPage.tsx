import { useEffect, useMemo, useState } from "react";
import {
  listarConvencoes,
  type Convencao,
} from "@features/admin/api/convencaoApi";
import {
  ClearFiltersButton,
  GestaoBackButton,
} from "@features/admin/ui/GestaoPageActions";
import { isRequestCanceled } from "@shared/utils/http";
import "@features/user/pages/HomePage.css";
import "./ConvencoesPage.css";

const searchDelayMs = 350;

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function onlyDigits(value?: string | null) {
  return String(value ?? "").replace(/\D/g, "");
}

export function ConvencoesPage() {
  const [convencoes, setConvencoes] = useState<Convencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nomeConvencao, setNomeConvencao] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [debouncedFilters, setDebouncedFilters] = useState({
    nomeConvencao: "",
    cnpj: "",
  });

  async function loadConvencoes(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);
      setConvencoes(await listarConvencoes(signal));
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return;

      setConvencoes([]);
      setError("Não foi possível carregar as convenções.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadConvencoes(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFilters({
        nomeConvencao: nomeConvencao.trim(),
        cnpj: cnpj.trim(),
      });
    }, searchDelayMs);

    return () => window.clearTimeout(timeout);
  }, [cnpj, nomeConvencao]);

  const filteredConvencoes = useMemo(() => {
    const nomeFiltro = normalizeText(debouncedFilters.nomeConvencao);
    const cnpjFiltro = normalizeText(debouncedFilters.cnpj);
    const cnpjFiltroNumerico = onlyDigits(debouncedFilters.cnpj);

    return convencoes.filter((convencao) => {
      const nomeOk =
        !nomeFiltro || normalizeText(convencao.nomeConvencao).includes(nomeFiltro);
      const cnpjOk =
        !cnpjFiltro ||
        normalizeText(convencao.cnpj).includes(cnpjFiltro) ||
        (cnpjFiltroNumerico.length > 0 &&
          onlyDigits(convencao.cnpj).includes(cnpjFiltroNumerico));

      return nomeOk && cnpjOk;
    });
  }, [convencoes, debouncedFilters]);

  const hasFilters = Boolean(nomeConvencao.trim() || cnpj.trim());

  function clearFilters() {
    setNomeConvencao("");
    setCnpj("");
    setDebouncedFilters({ nomeConvencao: "", cnpj: "" });
    void loadConvencoes();
  }

  return (
    <section className="portal-page convencoes-page" aria-labelledby="convencoes-title">
      <GestaoBackButton />

      <header className="portal-pageHeader">
        <h1 id="convencoes-title">Convenções</h1>
        <p>Consulte as convenções cadastradas no sistema.</p>
      </header>

      <section className="convencoes-filterCard" aria-label="Filtros de convenções">
        <label>
          <span>Nome da Convenção</span>
          <input
            value={nomeConvencao}
            onChange={(event) => setNomeConvencao(event.target.value)}
            placeholder="Buscar por nome..."
          />
        </label>

        <label>
          <span>CNPJ</span>
          <input
            value={cnpj}
            onChange={(event) => setCnpj(event.target.value)}
            placeholder="Buscar por CNPJ..."
          />
        </label>

        <div className="gestao-filterActions">
          <ClearFiltersButton
            disabled={!hasFilters}
            onClick={clearFilters}
          />
        </div>
      </section>

      <section className="convencoes-tableCard">
        {loading ? (
          <div className="portal-state">Carregando convenções...</div>
        ) : error ? (
          <div className="portal-state portal-state--error">{error}</div>
        ) : filteredConvencoes.length === 0 ? (
          <div className="convencoes-empty">
            <strong>Nenhuma convenção encontrada</strong>
            <span>
              {hasFilters
                ? "Nenhuma convenção encontrada para os filtros informados."
                : "Não há convenções cadastradas."}
            </span>
          </div>
        ) : (
          <div className="convencoes-tableWrap">
            <table className="convencoes-table">
              <thead>
                <tr>
                  <th>Nome da Convenção</th>
                  <th>CNPJ</th>
                </tr>
              </thead>
              <tbody>
                {filteredConvencoes.map((convencao) => (
                  <tr key={convencao.convencaoId}>
                    <td>{convencao.nomeConvencao}</td>
                    <td>{convencao.cnpj}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error ? (
          <footer className="convencoes-footer">
            {filteredConvencoes.length}{" "}
            {filteredConvencoes.length === 1
              ? "convenção encontrada"
              : "convenções encontradas"}
          </footer>
        ) : null}
      </section>
    </section>
  );
}
