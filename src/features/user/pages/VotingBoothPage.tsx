import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarEleicoesPorCampoEDataInicioVotacao,
  type EleicaoCabine,
} from "@features/admin/api/eleicaoApi";
import { useUserInfo } from "@features/user/model/UserInfoContext";
import {
  formatarDataHoraToBr,
  formatarDataToBr,
  formatarLocalDateTime,
} from "@shared/utils/formataData";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import "./HomePage.css";

function formatDate(value?: string | null): string {
  return value ? formatarDataToBr(value) : "-";
}

function formatDateTime(value?: string | null): string {
  return value ? formatarDataHoraToBr(value) : "-";
}

export function VotingBoothPage() {
  const navigate = useNavigate();
  const { usuario, loading: loadingUsuario, error: usuarioError } = useUserInfo();
  const [eleicoes, setEleicoes] = useState<EleicaoCabine[]>([]);
  const [loadingEleicoes, setLoadingEleicoes] = useState(false);
  const [eleicoesError, setEleicoesError] = useState<string | null>(null);

  const campoEclesiasticoId = useMemo(
    () => usuario?.campoEclesiastico?.id ?? usuario?.campoEclesiasticoId,
    [usuario]
  );

  useEffect(() => {
    if (loadingUsuario) {
      return;
    }

    if (!usuario || !campoEclesiasticoId) {
      setEleicoes([]);
      return;
    }

    const campoId = campoEclesiasticoId;
    const controller = new AbortController();

    async function carregarEleicoesDisponiveis() {
      try {
        setLoadingEleicoes(true);
        setEleicoesError(null);

        const data = await listarEleicoesPorCampoEDataInicioVotacao(
          campoId,
          formatarLocalDateTime(new Date()),
          controller.signal
        );

        setEleicoes(data);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setEleicoes([]);
        setEleicoesError(handleAxiosError(requestError));
      } finally {
        if (!controller.signal.aborted) {
          setLoadingEleicoes(false);
        }
      }
    }

    void carregarEleicoesDisponiveis();

    return () => controller.abort();
  }, [campoEclesiasticoId, loadingUsuario, usuario]);

  let content = (
    <div className="portal-state">
      Nenhuma eleição disponível para votação neste momento.
    </div>
  );

  if (loadingUsuario || loadingEleicoes) {
    content = (
      <div className="portal-state" role="status">
        Carregando votações disponíveis...
      </div>
    );
  } else if (usuarioError || !usuario) {
    content = (
      <div className="portal-state portal-state--error" role="alert">
        {usuarioError ?? "Não foi possível carregar as informações do usuário."}
      </div>
    );
  } else if (!campoEclesiasticoId) {
    content = (
      <div className="portal-state portal-state--error" role="alert">
        Não foi possível identificar o campo eclesiástico do usuário.
      </div>
    );
  } else if (eleicoesError) {
    content = (
      <div className="portal-state portal-state--error" role="alert">
        {eleicoesError}
      </div>
    );
  } else if (eleicoes.length > 0) {
    content = (
      <div className="voting-list">
        {eleicoes.map((eleicao) => (
          <button
            className="voting-card voting-card--button"
            key={eleicao.eleicaoId}
            type="button"
            onClick={() => navigate(`/votacao/cabine/${eleicao.eleicaoId}`)}
            aria-label={`Abrir eleição ${eleicao.nomeEvento}`}
          >
            <div className="voting-cardHeader">
              <div>
                <span>{eleicao.nomeConvencao}</span>
                <strong>{eleicao.nomeEvento}</strong>
              </div>
            </div>

            <dl className="voting-cardDetails">
              <div>
                <dt>Período</dt>
                <dd>
                  {formatDate(eleicao.dataInicial)} a{" "}
                  {formatDate(eleicao.dataFinal)}
                </dd>
              </div>
              <div>
                <dt>Início da votação</dt>
                <dd>{formatDateTime(eleicao.dataInicioVotacao)}</dd>
              </div>
              <div>
                <dt>Início da apuração</dt>
                <dd>{formatDateTime(eleicao.dataInicioApuracao)}</dd>
              </div>
            </dl>
          </button>
        ))}
      </div>
    );
  }

  return (
    <section className="portal-page" aria-labelledby="voting-title">
      <header className="portal-pageHeader">
        <h1 id="voting-title">Cabine de Votação</h1>
        <p>Acesse as votações disponíveis para seu perfil.</p>
      </header>

      {content}
    </section>
  );
}
