import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  buscarEleicaoPorId,
  type Eleicao,
} from "@features/admin/api/eleicaoApi";
import {
  buscarFotoUrlCandidato,
  listarCandidatos,
  type Candidato,
} from "@features/admin/api/candidatoApi";
import { MemberAvatar } from "@shared/ui/member-avatar/MemberAvatar";
import { formatarDataHoraToBr, formatarDataToBr } from "@shared/utils/formataData";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import "./HomePage.css";

const supportPageSize = 200;

function formatDate(value?: string | null): string {
  return value ? formatarDataToBr(value) : "-";
}

function formatDateTime(value?: string | null): string {
  return value ? formatarDataHoraToBr(value) : "-";
}

function groupCandidatesByCargo(candidatos: Candidato[]) {
  const groups = new Map<
    number,
    {
      cargoId: number;
      nomeCargo: string;
      candidatos: Candidato[];
    }
  >();

  candidatos.forEach((candidato) => {
    const cargoId = candidato.cargoIdEletivo;
    const nomeCargo = candidato.nomeCargoEletivo || "Cargo não informado";
    const currentGroup = groups.get(cargoId);

    if (currentGroup) {
      currentGroup.candidatos.push(candidato);
      return;
    }

    groups.set(cargoId, {
      cargoId,
      nomeCargo,
      candidatos: [candidato],
    });
  });

  return Array.from(groups.values());
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M11 5 4 12l7 7 1.4-1.4L7.8 13H20v-2H7.8l4.6-4.6L11 5Z" />
    </svg>
  );
}

function CandidatePhotoAvatar({ candidato }: { candidato: Candidato }) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [shouldLoadPhoto, setShouldLoadPhoto] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string | null>(
    candidato.fotoUrl ?? null
  );

  useEffect(() => {
    setShouldLoadPhoto(false);
    setPhotoSrc(candidato.fotoUrl ?? null);
  }, [candidato.candidatoId, candidato.fotoUrl]);

  useEffect(() => {
    const target = containerRef.current;

    if (!target || shouldLoadPhoto || photoSrc) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoadPhoto(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadPhoto(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [photoSrc, shouldLoadPhoto]);

  useEffect(() => {
    if (!shouldLoadPhoto || photoSrc) return;

    const controller = new AbortController();

    async function loadPhoto() {
      try {
        const fotoUrl = await buscarFotoUrlCandidato(
          candidato.eleicaoId,
          candidato.candidatoId,
          controller.signal
        );

        if (!fotoUrl || controller.signal.aborted) return;

        setPhotoSrc(fotoUrl);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;
      }
    }

    void loadPhoto();

    return () => {
      controller.abort();
    };
  }, [candidato.candidatoId, photoSrc, shouldLoadPhoto]);

  return (
    <span className="voting-candidatePhoto" ref={containerRef}>
      <MemberAvatar
        src={photoSrc}
        alt={candidato.nomeUsuario}
        fallback={candidato.nomeUsuario}
        size="md"
      />
    </span>
  );
}

export function VotingElectionPage() {
  const params = useParams<{ eleicaoId: string }>();
  const navigate = useNavigate();
  const eleicaoId = Number(params.eleicaoId);
  const hasValidEleicaoId = Number.isInteger(eleicaoId) && eleicaoId > 0;

  const [eleicao, setEleicao] = useState<Eleicao | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const candidatosPorCargo = useMemo(
    () => groupCandidatesByCargo(candidatos),
    [candidatos]
  );

  useEffect(() => {
    if (!hasValidEleicaoId) {
      setLoading(false);
      setError("Eleição inválida.");
      return;
    }

    const controller = new AbortController();

    async function carregarEleicao() {
      try {
        setLoading(true);
        setError(null);

        const [eleicaoResponse, candidatosResponse] = await Promise.all([
          buscarEleicaoPorId(eleicaoId, controller.signal),
          listarCandidatos(
            0,
            supportPageSize,
            { eleicaoId, incluirFoto: false },
            controller.signal
          ),
        ]);

        setEleicao(eleicaoResponse);
        setCandidatos(candidatosResponse.content);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setEleicao(null);
        setCandidatos([]);
        setError(handleAxiosError(requestError));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void carregarEleicao();

    return () => controller.abort();
  }, [eleicaoId, hasValidEleicaoId]);

  if (loading) {
    return (
      <section className="portal-state" role="status">
        Carregando eleição...
      </section>
    );
  }

  if (error || !eleicao) {
    return (
      <section className="portal-state portal-state--error" role="alert">
        {error ?? "Não foi possível carregar a eleição."}
      </section>
    );
  }

  return (
    <section className="portal-page" aria-labelledby="voting-election-title">
      <button
        className="portal-backButton"
        type="button"
        onClick={() => navigate("/votacao/cabine")}
      >
        <BackIcon />
        Voltar
      </button>

      <header className="portal-pageHeader">
        <h1 id="voting-election-title">{eleicao.nomeEvento}</h1>
        <p>{eleicao.nomeConvencao}</p>
      </header>

      <section className="voting-detailCard" aria-labelledby="voting-data-title">
        <div className="voting-detailHeader">
          <h2 id="voting-data-title">Dados da eleição</h2>
        </div>

        <dl className="voting-detailGrid">
          <div>
            <dt>Período</dt>
            <dd>
              {formatDate(eleicao.dataInicial)} a {formatDate(eleicao.dataFinal)}
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
          <div>
            <dt>Cadastro</dt>
            <dd>{formatDate(eleicao.dataCadastro)}</dd>
          </div>
        </dl>
      </section>

      <section className="voting-detailCard" aria-labelledby="voting-candidates-title">
        <div className="voting-detailHeader">
          <div>
            <h2 id="voting-candidates-title">Candidatos</h2>
            <p>{candidatos.length} candidato(s) vinculado(s)</p>
          </div>
        </div>

        {candidatos.length === 0 ? (
          <div className="portal-state">Nenhum candidato cadastrado para esta eleição.</div>
        ) : (
          <div className="voting-candidateGroups">
            {candidatosPorCargo.map((grupo) => (
              <section className="voting-candidateGroup" key={grupo.cargoId}>
                <div className="voting-candidateGroupHeader">
                  <h3>{grupo.nomeCargo}</h3>
                  <span>{grupo.candidatos.length} candidato(s)</span>
                </div>
                <div className="voting-candidateGrid">
                  {grupo.candidatos.map((candidato) => (
                    <article
                      className="voting-candidateCard"
                      key={candidato.candidatoId}
                    >
                      <CandidatePhotoAvatar candidato={candidato} />
                      <div>
                        <strong>{candidato.nomeUsuario}</strong>
                        <span>
                          {candidato.nomeCampoEclesiastico ??
                            "Campo eclesiástico não informado"}
                        </span>
                      </div>
                      <em>{candidato.numero}</em>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
