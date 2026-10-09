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
import {
  criarCedulaVotacao,
  registrarVoto,
  type VotoRegistradoResponse,
} from "@features/user/api/votoApi";
import { MemberAvatar } from "@shared/ui/member-avatar/MemberAvatar";
import { alerts } from "@shared/lib/swal";
import { formatarDataHoraToBr, formatarDataToBr } from "@shared/utils/formataData";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import "./HomePage.css";

const supportPageSize = 200;
const nullVoteNumber = 0;

type CandidateGroup = {
  cargoId: number;
  nomeCargo: string;
  candidatos: Candidato[];
};

type SelectedVotes = Record<number, number>;
type VotingStep = "voting" | "review";

function formatDate(value?: string | null): string {
  return value ? formatarDataToBr(value) : "-";
}

function formatDateTime(value?: string | null): string {
  return value ? formatarDataHoraToBr(value) : "-";
}

function groupCandidatesByCargo(candidatos: Candidato[]) {
  const groups = new Map<number, CandidateGroup>();

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

function getSelectedCandidate(grupo: CandidateGroup, voto?: number) {
  if (voto === undefined || voto === nullVoteNumber) {
    return null;
  }

  return grupo.candidatos.find((candidato) => candidato.numero === voto) ?? null;
}

function getRenderablePhotoSrc(value?: string | null): string | null {
  const photo = (value ?? "").trim();

  if (!photo) {
    return null;
  }

  if (/^s3:\/\//i.test(photo) || /^eleicoes\//i.test(photo)) {
    return null;
  }

  return photo;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M11 5 4 12l7 7 1.4-1.4L7.8 13H20v-2H7.8l4.6-4.6L11 5Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m9.2 16.2-3.5-3.5L4.3 14l4.9 4.9L20.5 7.6l-1.4-1.4-9.9 10Z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 3h6l1 2h3v16H5V5h3l1-2Zm1.2 2-.5 1h4.6l-.5-1h-3.6ZM7 7v12h10V7H7Zm2 4h6v2H9v-2Zm0 4h4v2H9v-2Z" />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5h16v2H4V5Zm0 6h16v2H4v-2Zm0 6h16v2H4v-2Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m13 5 7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6L13 5Z" />
    </svg>
  );
}

function NullVoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2c1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.96 7.96 0 0 1 12 4Zm0 16a7.96 7.96 0 0 1-4.9-1.69L18.31 7.1A8 8 0 0 1 12 20Z" />
    </svg>
  );
}

function CandidatePhotoAvatar({
  candidato,
  eleicaoId,
}: {
  candidato: Candidato;
  eleicaoId: number;
}) {
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [shouldLoadPhoto, setShouldLoadPhoto] = useState(false);
  const [photoSrc, setPhotoSrc] = useState<string | null>(
    getRenderablePhotoSrc(candidato.fotoUrl)
  );

  useEffect(() => {
    setShouldLoadPhoto(false);
    setPhotoSrc(getRenderablePhotoSrc(candidato.fotoUrl));
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
          eleicaoId,
          candidato.candidatoId,
          controller.signal
        );

        const renderableFotoUrl = getRenderablePhotoSrc(fotoUrl);

        if (!renderableFotoUrl || controller.signal.aborted) return;

        setPhotoSrc(renderableFotoUrl);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;
      }
    }

    void loadPhoto();

    return () => {
      controller.abort();
    };
  }, [candidato.candidatoId, eleicaoId, photoSrc, shouldLoadPhoto]);

  return (
    <span className="voting-candidatePhoto" ref={containerRef}>
      <MemberAvatar
        src={photoSrc}
        alt={candidato.nomeUsuario}
        fallback={candidato.nomeUsuario}
        size={48}
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
  const [selectedVotes, setSelectedVotes] = useState<SelectedVotes>({});
  const [step, setStep] = useState<VotingStep>("voting");
  const [submitting, setSubmitting] = useState(false);
  const [votoRegistrado, setVotoRegistrado] =
    useState<VotoRegistradoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const candidatosPorCargo = useMemo(
    () => groupCandidatesByCargo(candidatos),
    [candidatos]
  );
  const totalCargos = candidatosPorCargo.length;
  const cargosPreenchidos = useMemo(
    () =>
      candidatosPorCargo.filter(
        (grupo) => selectedVotes[grupo.cargoId] !== undefined
      ).length,
    [candidatosPorCargo, selectedVotes]
  );
  const progressPercent =
    totalCargos > 0 ? Math.round((cargosPreenchidos / totalCargos) * 100) : 0;
  const canReview =
    totalCargos > 0 && cargosPreenchidos === totalCargos && !submitting;

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
        setSelectedVotes({});
        setStep("voting");
        setVotoRegistrado(null);

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

  function handleSelectVote(cargoId: number, voto: number) {
    if (submitting || votoRegistrado) return;

    setSelectedVotes((current) => ({
      ...current,
      [cargoId]: voto,
    }));
  }

  async function handleOpenReview() {
    if (!canReview) {
      await alerts.warn({
        text: "Selecione um candidato ou Nulo para cada cargo antes de revisar.",
      });
      return;
    }

    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleConfirmVote() {
    if (!eleicao || !canReview) return;

    const confirmed = await alerts.confirm({
      title: "Confirmar voto?",
      text: "Após confirmar, seu voto será registrado e não poderá ser alterado.",
      confirmButtonText: "Confirmar voto",
      cancelButtonText: "Voltar",
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);
      alerts.loading({
        title: "Registrando voto...",
        text: "Aguarde a geração do comprovante.",
      });

      const cedula = await criarCedulaVotacao(eleicao.eleicaoId);
      const response = await registrarVoto({
        cedulaId: cedula.cedulaId,
        cargosVotados: candidatosPorCargo.map((grupo) => ({
          cargoId: grupo.cargoId,
          voto: selectedVotes[grupo.cargoId],
        })),
      });

      alerts.close();
      setVotoRegistrado(response);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyKey() {
    if (!votoRegistrado?.chaveVerificacao) return;

    try {
      await navigator.clipboard.writeText(votoRegistrado.chaveVerificacao);
      await alerts.success({
        text: "Chave copiada para a área de transferência.",
        timer: 1200,
      });
    } catch {
      await alerts.error({ text: "Não foi possível copiar a chave." });
    }
  }

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

  if (votoRegistrado) {
    return (
      <section className="portal-page" aria-labelledby="voting-success-title">
        <button
          className="portal-backButton"
          type="button"
          onClick={() => navigate("/votacao/cabine")}
        >
          <BackIcon />
          Voltar
        </button>

        <section className="voting-successCard" aria-labelledby="voting-success-title">
          <span className="voting-successIcon">
            <CheckIcon />
          </span>
          <div>
            <h1 id="voting-success-title">Voto registrado com sucesso</h1>
            <p>
              Guarde a chave abaixo para verificar futuramente que seu voto foi
              registrado.
            </p>
          </div>

          <div className="voting-successKey">
            <span>Chave de verificação</span>
            <strong>{votoRegistrado.chaveVerificacao}</strong>
          </div>

          <div className="voting-successActions">
            <button
              className="voting-secondaryButton"
              type="button"
              onClick={() => void handleCopyKey()}
            >
              <ClipboardIcon />
              Copiar chave
            </button>
            <button
              className="voting-submitButton"
              type="button"
              onClick={() => navigate("/votacao/cabine")}
            >
              Voltar para a cabine
            </button>
          </div>
        </section>
      </section>
    );
  }

  if (step === "review") {
    return (
      <section className="portal-page voting-electionPage" aria-labelledby="voting-review-title">
        <button
          className="portal-backButton"
          type="button"
          onClick={() => setStep("voting")}
        >
          <BackIcon />
          Voltar para votação
        </button>

        <header className="portal-pageHeader voting-stepHeader">
          <div>
            <span className="voting-stepBadge">Etapa 2 de 2</span>
            <h1 id="voting-review-title">Revisar voto</h1>
            <p>
              {eleicao.nomeEvento} · {eleicao.nomeConvencao}
            </p>
          </div>
          <div className="voting-progressCompact">
            <strong>
              {cargosPreenchidos} de {totalCargos} cargos preenchidos
            </strong>
            <span>
              <i style={{ width: `${progressPercent}%` }} />
            </span>
          </div>
        </header>

        <section className="voting-reviewCard" aria-labelledby="voting-review-summary-title">
          <div className="voting-detailHeader">
            <div>
              <h2 id="voting-review-summary-title">Confirmação do voto</h2>
              <p>Confira as escolhas antes da confirmação final.</p>
            </div>
          </div>

          <ul className="voting-reviewList">
            {candidatosPorCargo.map((grupo) => {
              const votoSelecionado = selectedVotes[grupo.cargoId];
              const candidatoSelecionado = getSelectedCandidate(
                grupo,
                votoSelecionado
              );
              const votoNulo = votoSelecionado === nullVoteNumber;

              return (
                <li key={grupo.cargoId}>
                  <span className="voting-reviewMedia">
                    {candidatoSelecionado ? (
                      <CandidatePhotoAvatar
                        candidato={candidatoSelecionado}
                        eleicaoId={eleicaoId}
                      />
                    ) : (
                      <span className="voting-nullIcon">
                        <NullVoteIcon />
                      </span>
                    )}
                  </span>
                  <div className="voting-reviewContent">
                    <span>{grupo.nomeCargo}</span>
                    <strong>
                      {candidatoSelecionado
                        ? candidatoSelecionado.nomeUsuario
                        : "Nulo"}
                    </strong>
                    <em>
                      {candidatoSelecionado
                        ? candidatoSelecionado.nomeCampoEclesiastico ??
                          "Campo eclesiástico não informado"
                        : "Voto nulo neste cargo"}
                    </em>
                  </div>
                  <b>{votoNulo ? 0 : votoSelecionado ?? "-"}</b>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="voting-submitBar" role="region" aria-label="Confirmar voto">
          <div className="voting-submitProgress">
            <strong>Revise antes de confirmar</strong>
            <span>
              <i style={{ width: "100%" }} />
            </span>
          </div>

          <p>Depois da confirmação, o voto será registrado e não poderá ser alterado.</p>

          <div className="voting-reviewActions">
            <button
              className="voting-secondaryButton"
              type="button"
              onClick={() => setStep("voting")}
              disabled={submitting}
            >
              Voltar
            </button>
            <button
              className="voting-submitButton"
              type="button"
              onClick={() => void handleConfirmVote()}
              disabled={submitting}
            >
              Confirmar voto
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="portal-page voting-electionPage" aria-labelledby="voting-election-title">
      <button
        className="portal-backButton"
        type="button"
        onClick={() => navigate("/votacao/cabine")}
      >
        <BackIcon />
        Voltar
      </button>

      <header className="portal-pageHeader voting-stepHeader">
        <div>
          <span className="voting-stepBadge">Etapa 1 de 2</span>
          <h1 id="voting-election-title">{eleicao.nomeEvento}</h1>
          <p>{eleicao.nomeConvencao}</p>
        </div>
      </header>

      <section className="voting-detailCard" aria-labelledby="voting-data-title">
        <div className="voting-detailHeader">
          <h2 id="voting-data-title">Dados da eleição</h2>
        </div>

        <dl className="voting-detailGrid voting-detailGrid--four">
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
        <div className="voting-detailHeader voting-candidatesHeader">
          <div>
            <h2 id="voting-candidates-title">Candidatos</h2>
            <p>{candidatos.length} candidato(s) vinculado(s)</p>
          </div>

          {totalCargos > 0 && (
            <div className="voting-progressCompact">
              <strong>
                {cargosPreenchidos} de {totalCargos} cargos preenchidos
              </strong>
              <span>
                <i style={{ width: `${progressPercent}%` }} />
              </span>
            </div>
          )}
        </div>

        {candidatos.length === 0 ? (
          <div className="portal-state">Nenhum candidato cadastrado para esta eleição.</div>
        ) : (
          <div className="voting-candidateGroups">
            {candidatosPorCargo.map((grupo) => (
              <section className="voting-candidateGroup" key={grupo.cargoId}>
                <div className="voting-candidateGroupHeader">
                  <div>
                    <h3>{grupo.nomeCargo}</h3>
                    <p>Escolha apenas uma opção para este cargo.</p>
                  </div>
                </div>
                <div className="voting-candidateGrid voting-voteGrid">
                  {grupo.candidatos.map((candidato) => {
                    const selected =
                      selectedVotes[grupo.cargoId] === candidato.numero;

                    return (
                      <button
                        className={`voting-candidateCard voting-voteOption voting-voteOption--candidate${
                          selected ? " voting-voteOption--selected" : ""
                        }`}
                        key={candidato.candidatoId}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          handleSelectVote(grupo.cargoId, candidato.numero)
                        }
                      >
                        <CandidatePhotoAvatar
                          candidato={candidato}
                          eleicaoId={eleicaoId}
                        />
                        <div className="voting-candidateInfo">
                          {selected && (
                            <span className="voting-selectedBadge voting-selectedBadge--inline">
                              <CheckIcon />
                              Selecionado
                            </span>
                          )}
                          <strong>{candidato.nomeUsuario}</strong>
                          <span className="voting-candidateLocation">
                            {candidato.nomeCampoEclesiastico ??
                              "Campo eclesiástico não informado"}
                          </span>
                        </div>
                        <em>{candidato.numero}</em>
                      </button>
                    );
                  })}

                  <button
                    className={`voting-candidateCard voting-voteOption voting-voteOption--null${
                      selectedVotes[grupo.cargoId] === nullVoteNumber
                        ? " voting-voteOption--selected"
                        : ""
                    }`}
                    type="button"
                    aria-pressed={selectedVotes[grupo.cargoId] === nullVoteNumber}
                    onClick={() => handleSelectVote(grupo.cargoId, nullVoteNumber)}
                  >
                    {selectedVotes[grupo.cargoId] === nullVoteNumber && (
                      <span className="voting-selectedBadge">
                        <CheckIcon />
                        Selecionado
                      </span>
                    )}
                    <span className="voting-nullIcon">
                      <NullVoteIcon />
                    </span>
                    <div>
                      <strong>Nulo</strong>
                      <span>Voto nulo neste cargo</span>
                    </div>
                    <em>0</em>
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {candidatos.length > 0 && (
        <div className="voting-submitBar" role="region" aria-label="Resumo do voto">
          <div className="voting-submitProgress">
            <strong>
              {cargosPreenchidos} de {totalCargos} cargos preenchidos
            </strong>
            <span>
              <i style={{ width: `${progressPercent}%` }} />
            </span>
          </div>

          <p>
            Selecione um candidato ou Nulo para cada cargo antes de confirmar.
          </p>

          <button
            className="voting-submitButton"
            type="button"
            disabled={!canReview}
            onClick={() => void handleOpenReview()}
          >
            <ReviewIcon />
            Revisar voto
            <ArrowIcon />
          </button>
        </div>
      )}
    </section>
  );
}
