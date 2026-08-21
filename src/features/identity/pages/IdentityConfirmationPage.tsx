import { useEffect, useState } from "react";
import {
  aprovarUsuario,
  listarUsuariosPendentes,
  obterUsuarioPorId,
  reprovarUsuario,
  solicitarCorrecaoUsuario,
  type CampoAnaliseUsuario,
  type PageResponse,
  type ResultadoAnaliseUsuario,
  type UsuarioAnaliseItemRequest,
  type UsuarioAnaliseRequest,
  type UsuarioResponse,
} from "@features/user/api/userApi";
import { CARGOS_ECLESIASTICOS } from "@shared/data/cargos";
import { alerts } from "@shared/lib/swal";
import { getDocumentMediaSrc, isPdfDocument } from "@shared/utils/documentMedia";
import { isRequestCanceled } from "@shared/utils/http";
import { maskCPF, maskPhoneBR } from "@shared/utils/masks";
import "@features/user/pages/HomePage.css";
import "./IdentityConfirmationPage.css";

type EvaluationStatus = "pendente" | "aprovado" | "reprovado";
type EvaluationKey = "foto" | "nome" | "cpf" | "dataNascimento" | "fotoDocumento";
type IdentityIconName = "status" | "member" | "document" | "check" | "correction" | "reject";

type EvaluationItem = {
  status: EvaluationStatus;
  observacao: string;
};

type Evaluations = Record<EvaluationKey, EvaluationItem>;

const pageSize = 8;

const evaluationLabels: Record<EvaluationKey, string> = {
  foto: "Foto do rosto",
  nome: "Nome completo",
  cpf: "CPF",
  dataNascimento: "Data de nascimento",
  fotoDocumento: "Foto do documento",
};

const evaluationApiFields: Record<EvaluationKey, CampoAnaliseUsuario> = {
  foto: "FOTO",
  nome: "NOME",
  cpf: "CPF",
  dataNascimento: "DATA_NASCIMENTO",
  fotoDocumento: "FOTO_DOCUMENTO",
};

const statusOptions = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "REANALISE", label: "Reanálise" },
];

const initialEvaluations: Evaluations = {
  foto: { status: "pendente", observacao: "" },
  nome: { status: "pendente", observacao: "" },
  cpf: { status: "pendente", observacao: "" },
  dataNascimento: { status: "pendente", observacao: "" },
  fotoDocumento: { status: "pendente", observacao: "" },
};

const memberEvaluationFields: Array<{
  key: Extract<EvaluationKey, "nome" | "cpf" | "dataNascimento">;
  label: string;
  getValue: (usuario: UsuarioResponse) => string;
}> = [
  {
    key: "nome",
    label: "Nome completo",
    getValue: (usuario) => usuario.nome,
  },
  {
    key: "cpf",
    label: "CPF",
    getValue: (usuario) => maskCPF(usuario.cpf ?? ""),
  },
  {
    key: "dataNascimento",
    label: "Data de nascimento",
    getValue: (usuario) => formatDateWithAge(usuario.dataNascimento),
  },
];

function IdentityIcon({ name }: { name: IdentityIconName }) {
  const paths: Record<IdentityIconName, string> = {
    status:
      "M8 4h8v2h3v14H5V6h3V4Zm2 2h4V5h-4v1ZM7 8v10h10V8H7Zm2 3h6v2H9v-2Zm0 3h4v2H9v-2Z",
    member:
      "M7 3h10a1 1 0 0 1 1 1v16H6V4a1 1 0 0 1 1-1Zm1 2v14h8V5H8Zm2 2h4v2h-4V7Zm0 4h4v2h-4v-2Zm0 4h3v2h-3v-2Z",
    document:
      "M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14H4V5Zm2 0v12h12V5H6Zm2 2h4v4H8V7Zm6 1h2v2h-2V8Zm-6 5h8v2H8v-2Z",
    check:
      "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.1 13.6 6-6-1.4-1.4-4.6 4.6-2.1-2.1-1.4 1.4 3.5 3.5Z",
    correction:
      "M4 6h12v2H4V6Zm0 5h8v2H4v-2Zm12.7.3 1.4 1.4-4.8 4.8H12v-1.3l4.7-4.9Zm2.1-2.1.7.7a1 1 0 0 1 0 1.4l-.7.7-1.4-1.4.7-.7a1 1 0 0 1 .7-.3ZM4 16h6v2H4v-2Z",
    reject:
      "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-4.2 6.4 7.8 7.8.6-.6-7.8-7.8-.6.6Zm1.4 9.4 8.6-8.6-1.4-1.4-8.6 8.6 1.4 1.4Z",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function formatLabel(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

function formatDateWithAge(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const birthdayPassed =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());

  if (!birthdayPassed) age -= 1;

  const formattedDate = formatDate(value);

  return age >= 0 ? `${formattedDate} (${age} anos)` : formattedDate;
}

function getImageSrc(value?: string | null): string | null {
  const photo = (value ?? "").trim();
  if (!photo) return null;
  if (photo.startsWith("data:image/") || /^https?:\/\//i.test(photo)) return photo;
  return `data:image/jpeg;base64,${photo}`;
}

function getStatusClass(value?: string | null): string {
  return String(value ?? "pendente").toLowerCase();
}

function getCadastroStatus(usuario: UsuarioResponse): string {
  return usuario.situacaoUsuario ?? usuario.status ?? "PENDENTE";
}

function getReviewStatusLabel(usuario: UsuarioResponse): string {
  const status = getCadastroStatus(usuario);

  if (status === "PENDENTE") return "Aguardando revisão";
  if (status === "REANALISE") return "Em reanálise";
  return formatLabel(status);
}

function getCampoLabel(usuario: UsuarioResponse): string {
  return (
    usuario.campoEclesiastico?.nomeCampo ??
    (usuario.campoEclesiasticoId ? `Campo ${usuario.campoEclesiasticoId}` : "-")
  );
}

function isAllApproved(evaluations: Evaluations): boolean {
  return Object.values(evaluations).every((item) => item.status === "aprovado");
}

function hasRejectedWithObservation(evaluations: Evaluations): boolean {
  const rejected = Object.values(evaluations).filter(
    (item) => item.status === "reprovado"
  );

  return (
    rejected.length > 0 &&
    rejected.every((item) => item.observacao.trim().length > 0)
  );
}

function hasRejected(evaluations: Evaluations): boolean {
  return Object.values(evaluations).some((item) => item.status === "reprovado");
}

function getPhotoMatchStatus(evaluations: Evaluations): EvaluationStatus {
  if (
    evaluations.foto.status === "aprovado" &&
    evaluations.fotoDocumento.status === "aprovado"
  ) {
    return "aprovado";
  }

  if (
    evaluations.foto.status === "reprovado" ||
    evaluations.fotoDocumento.status === "reprovado"
  ) {
    return "reprovado";
  }

  return "pendente";
}

function toApiResultado(status: EvaluationStatus): ResultadoAnaliseUsuario | null {
  if (status === "aprovado") return "APROVADO";
  if (status === "reprovado") return "REPROVADO";
  return null;
}

function buildAnalisePayload(evaluations: Evaluations): UsuarioAnaliseRequest {
  const itens: UsuarioAnaliseItemRequest[] = [];

  (Object.keys(evaluationLabels) as EvaluationKey[]).forEach((key) => {
    const item = evaluations[key];
    const resultado = toApiResultado(item.status);

    if (!resultado) return;

    itens.push({
      campo: evaluationApiFields[key],
      resultado,
      observacao: item.observacao.trim() || undefined,
    });
  });

  return {
    itens,
  };
}

export function IdentityConfirmationPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<UsuarioResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cargo, setCargo] = useState("");
  const [status, setStatus] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioResponse | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluations>(initialEvaluations);
  const [preview, setPreview] = useState<string | null>(null);
  const [documentImageFailed, setDocumentImageFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadUsers(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);
      const response = await listarUsuariosPendentes(
        page,
        pageSize,
        {
          busca: search.trim(),
          cargo,
          status,
        },
        signal
      );
      setData(response);
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return;

      setData(null);
      setError("Não foi possível carregar os cadastros.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadUsers(controller.signal);
    return () => controller.abort();
  }, [cargo, page, search, status]);

  async function openDrawer(usuario: UsuarioResponse) {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setSelectedUser(null);
    setEvaluations(initialEvaluations);
    setDocumentImageFailed(false);

    try {
      const details = await obterUsuarioPorId(usuario.id);
      setSelectedUser(details);
    } catch {
      await alerts.error({
        text: "Não foi possível carregar os dados do cadastro.",
      });
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  }

  function closeDrawer() {
    if (submitting) return;
    setDrawerOpen(false);
    setSelectedUser(null);
    setPreview(null);
    setDocumentImageFailed(false);
    setEvaluations(initialEvaluations);
  }

  function setEvaluationStatus(key: EvaluationKey, nextStatus: EvaluationStatus) {
    setEvaluations((current) => ({
      ...current,
      [key]: {
        status: nextStatus,
        observacao: nextStatus === "reprovado" ? current[key].observacao : "",
      },
    }));
  }

  function setEvaluationNote(key: EvaluationKey, observacao: string) {
    setEvaluations((current) => ({
      ...current,
      [key]: {
        ...current[key],
        observacao,
      },
    }));
  }

  function setPhotoMatchStatus(nextStatus: Extract<EvaluationStatus, "aprovado" | "reprovado">) {
    setEvaluations((current) => ({
      ...current,
      foto: {
        status: nextStatus,
        observacao: nextStatus === "reprovado" ? current.foto.observacao : "",
      },
      fotoDocumento: {
        status: nextStatus,
        observacao:
          nextStatus === "reprovado" ? current.fotoDocumento.observacao : "",
      },
    }));
  }

  function setPhotoMatchNote(observacao: string) {
    setEvaluations((current) => ({
      ...current,
      foto: {
        ...current.foto,
        observacao,
      },
      fotoDocumento: {
        ...current.fotoDocumento,
        observacao,
      },
    }));
  }

  async function handleApprove() {
    if (!selectedUser || !isAllApproved(evaluations) || submitting) return;

    const confirmed = await alerts.confirm({
      title: "Aprovar cadastro?",
      text: "Você confirma que os dados e documentos foram verificados?",
      confirmButtonText: "Confirmar aprovação",
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);
      alerts.loading({ title: "Aprovando...", text: "Atualizando cadastro." });
      await aprovarUsuario(selectedUser.id, buildAnalisePayload(evaluations));
      alerts.close();
      await alerts.success({ text: "Cadastro aprovado com sucesso." });
      closeDrawer();
      await loadUsers();
    } catch {
      alerts.close();
      await alerts.error({ text: "Não foi possível aprovar o cadastro." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSolicitarCorrecao() {
    if (!hasRejectedWithObservation(evaluations)) {
      await alerts.warn({
        text: "Reprove ao menos um atributo e informe a observação específica.",
      });
      return;
    }

    if (!selectedUser || submitting) return;

    try {
      setSubmitting(true);
      alerts.loading({
        title: "Solicitando correção...",
        text: "Registrando itens reprovados.",
      });
      await solicitarCorrecaoUsuario(selectedUser.id, buildAnalisePayload(evaluations));
      alerts.close();
      await alerts.success({ text: "Solicitação de correção registrada com sucesso." });
      closeDrawer();
      await loadUsers();
    } catch {
      alerts.close();
      await alerts.error({ text: "Não foi possível solicitar a correção." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReprovar() {
    if (!hasRejectedWithObservation(evaluations)) {
      await alerts.warn({
        text: "Reprove ao menos um atributo e informe a observação específica.",
      });
      return;
    }

    if (!selectedUser || submitting) return;

    const confirmed = await alerts.confirm({
      title: "Reprovar cadastro?",
      text: "Essa ação reprovará definitivamente o cadastro selecionado.",
      confirmButtonText: "Confirmar reprovação",
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);
      alerts.loading({ title: "Reprovando...", text: "Atualizando cadastro." });
      await reprovarUsuario(selectedUser.id, buildAnalisePayload(evaluations));
      alerts.close();
      await alerts.success({ text: "Cadastro reprovado com sucesso." });
      closeDrawer();
      await loadUsers();
    } catch {
      alerts.close();
      await alerts.error({ text: "Não foi possível reprovar o cadastro." });
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = data?.totalPages ?? 0;
  const users = data?.content ?? [];
  const canApprove = isAllApproved(evaluations);
  const canSendRejected = hasRejected(evaluations);
  const photoMatchStatus = getPhotoMatchStatus(evaluations);
  const photoMatchNote =
    evaluations.foto.observacao || evaluations.fotoDocumento.observacao;
  const facePhoto = getImageSrc(selectedUser?.foto);
  const documentPhoto = getDocumentMediaSrc(
    selectedUser?.fotoDocumento,
    selectedUser?.fotoDocumentoContentType
  );
  const documentIsPdf =
    isPdfDocument(selectedUser?.fotoDocumento, selectedUser?.fotoDocumentoContentType) ||
    documentImageFailed;

  return (
    <section className="portal-page identity-page" aria-labelledby="identity-title">
      <header className="portal-pageHeader">
        <h1 id="identity-title">Confirmação de Identidade</h1>
        <p>
          Analise os cadastros enviados pelos membros antes de aprová-los.
        </p>
      </header>

      <section className="identity-toolbar" aria-label="Filtros de cadastro">
        <input
          className="identity-search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder="Buscar por nome ou CPF..."
        />
        <select
          value={cargo}
          onChange={(event) => {
            setCargo(event.target.value);
            setPage(0);
          }}
        >
          <option value="">Todos os cargos</option>
          {CARGOS_ECLESIASTICOS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(0);
          }}
        >
          <option value="">Todos os status</option>
          {statusOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </section>

      <section className="identity-tableCard">
        {loading ? (
          <div className="portal-state">Carregando cadastros...</div>
        ) : error ? (
          <div className="portal-state portal-state--error">{error}</div>
        ) : users.length === 0 ? (
          <div className="identity-empty">
            <strong>Nenhum cadastro pendente</strong>
            <span>Não existem membros aguardando confirmação nesta página.</span>
          </div>
        ) : (
          <div className="identity-tableWrap">
            <table className="identity-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Cargo</th>
                  <th>Telefone</th>
                  <th>Cidade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>#{usuario.id}</td>
                    <td className="identity-tableName">{usuario.nome}</td>
                    <td>{maskCPF(usuario.cpf ?? "")}</td>
                    <td>{formatLabel(usuario.cargo)}</td>
                    <td>{usuario.telefone ? maskPhoneBR(usuario.telefone) : "-"}</td>
                    <td>{usuario.campoEclesiasticoId ? `Campo ${usuario.campoEclesiasticoId}` : "-"}</td>
                    <td>
                      <span className={`portal-badge portal-badge--${getStatusClass(getCadastroStatus(usuario))}`}>
                        {formatLabel(getCadastroStatus(usuario))}
                      </span>
                    </td>
                    <td>
                      <button
                        className="identity-actionButton"
                        type="button"
                        onClick={() => void openDrawer(usuario)}
                      >
                        Visualizar
                      </button>
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

      {drawerOpen ? (
        <>
          <button
            className="identity-drawerBackdrop"
            type="button"
            aria-label="Fechar análise"
            onClick={closeDrawer}
          />
          <aside className="identity-drawer" aria-labelledby="identity-drawer-title">
            <header className="identity-drawerHeader">
              <div>
                <h2 id="identity-drawer-title">Análise de Cadastro</h2>
                <span>
                  ID da solicitação: {selectedUser ? `#${selectedUser.id}` : "-"}
                </span>
              </div>
              <button type="button" onClick={closeDrawer} aria-label="Fechar">
                ×
              </button>
            </header>

            {drawerLoading || !selectedUser ? (
              <div className="identity-drawerBody">
                <div className="portal-state">Carregando análise...</div>
              </div>
            ) : (
              <>
                <div className="identity-drawerBody">
                  <section className="identity-drawerCard identity-statusCard">
                    <span className="identity-statusIcon" aria-hidden="true">
                      <IdentityIcon name="status" />
                    </span>
                    <span className="identity-statusTitle">Status Atual</span>
                    <em>{getReviewStatusLabel(selectedUser)}</em>
                  </section>

                  <section className="identity-drawerCard identity-memberCard">
                    <header className="identity-cardTitle">
                      <span className="identity-cardIcon" aria-hidden="true">
                        <IdentityIcon name="member" />
                      </span>
                      <h3>Dados do Membro</h3>
                    </header>

                    <div className="identity-memberRows">
                      {memberEvaluationFields.map((field) => {
                        const item = evaluations[field.key];

                        return (
                          <div
                            className={`identity-memberAnalysisField is-${item.status}`}
                            key={field.key}
                          >
                            <div className="identity-memberAnalysisMain">
                              <div className="identity-memberFieldValue">
                                <span>{field.label}</span>
                                <span className="identity-memberValue">
                                  {field.getValue(selectedUser)}
                                </span>
                              </div>

                              <div className="identity-choiceGroup">
                                <button
                                  type="button"
                                  className={
                                    item.status === "aprovado" ? "is-approved" : ""
                                  }
                                  onClick={() => setEvaluationStatus(field.key, "aprovado")}
                                >
                                  Aprovar
                                </button>
                                <button
                                  type="button"
                                  className={
                                    item.status === "reprovado" ? "is-rejected" : ""
                                  }
                                  onClick={() => setEvaluationStatus(field.key, "reprovado")}
                                >
                                  Reprovar
                                </button>
                              </div>
                            </div>

                            {item.status === "reprovado" ? (
                              <label className="identity-fieldReason">
                                <span>Motivo da Reprovação</span>
                                <input
                                  value={item.observacao}
                                  onChange={(event) =>
                                    setEvaluationNote(field.key, event.target.value)
                                  }
                                  placeholder="Informe o motivo da divergência..."
                                />
                              </label>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    <div className="identity-memberStaticGrid">
                      <div>
                        <span>Cargo vinculado</span>
                        <span className="identity-memberValue">
                          {formatLabel(selectedUser.cargo)}
                        </span>
                      </div>
                      <div>
                        <span>Campo declarado</span>
                        <span className="identity-memberValue">
                          {getCampoLabel(selectedUser)}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="identity-drawerCard identity-photoCard">
                    <header className="identity-cardTitle">
                      <span className="identity-cardIcon" aria-hidden="true">
                        <IdentityIcon name="document" />
                      </span>
                      <h3>Documentação Fotográfica</h3>
                    </header>
                    <p>
                      Compare visualmente a selfie enviada com a foto do documento
                      oficial para confirmar a identidade.
                    </p>
                    <div className="identity-photoGrid">
                      <button
                        className="identity-photoPreviewButton"
                        type="button"
                        onClick={() => facePhoto && setPreview(facePhoto)}
                      >
                        <span className="identity-photoLabel">Foto do Membro (Selfie)</span>
                        {facePhoto ? (
                          <img src={facePhoto} alt="Foto do membro" />
                        ) : (
                          <span className="identity-photoPlaceholder">Sem foto</span>
                        )}
                      </button>
                      <button
                        className={`identity-photoPreviewButton ${
                          documentIsPdf ? "identity-photoPreviewButton--pdf" : ""
                        }`}
                        type="button"
                        onClick={() => {
                          if (!documentPhoto) return;
                          if (documentIsPdf) {
                            window.open(documentPhoto, "_blank", "noopener,noreferrer");
                            return;
                          }
                          setPreview(documentPhoto);
                        }}
                      >
                        <span className="identity-photoLabel">Documento Oficial</span>
                        {documentPhoto ? (
                          documentIsPdf ? (
                            <span className="identity-pdfPreview">
                              <strong>PDF</strong>
                              <span>Abrir documento</span>
                            </span>
                          ) : (
                            <img
                              src={documentPhoto}
                              alt="Foto do documento"
                              onError={() => setDocumentImageFailed(true)}
                            />
                          )
                        ) : (
                          <span className="identity-photoPlaceholder">Sem documento</span>
                        )}
                      </button>
                    </div>

                    <div className={`identity-photoQuestion is-${photoMatchStatus}`}>
                      <div className="identity-photoQuestionMain">
                        <span>As fotos correspondem à mesma pessoa?</span>
                        <div className="identity-choiceGroup">
                          <button
                            type="button"
                            className={
                              photoMatchStatus === "aprovado" ? "is-approved" : ""
                            }
                            onClick={() => setPhotoMatchStatus("aprovado")}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            className={
                              photoMatchStatus === "reprovado" ? "is-rejected" : ""
                            }
                            onClick={() => setPhotoMatchStatus("reprovado")}
                          >
                            Não
                          </button>
                        </div>
                      </div>

                      {photoMatchStatus === "reprovado" ? (
                        <label className="identity-fieldReason">
                          <span>Detalhes da inconsistência visual</span>
                          <input
                            value={photoMatchNote}
                            onChange={(event) => setPhotoMatchNote(event.target.value)}
                            placeholder="Ex: Rosto não confere, foto ilegível..."
                          />
                        </label>
                      ) : null}
                    </div>
                  </section>

                </div>

                <footer className="identity-drawerFooter">
                  <button
                    className={`identity-approveButton ${canApprove ? "is-enabled" : "is-disabled"}`}
                    type="button"
                    disabled={!canApprove || submitting}
                    onClick={() => void handleApprove()}
                  >
                    <span aria-hidden="true">
                      <IdentityIcon name="check" />
                    </span>
                    {submitting ? "Aprovando..." : "Aprovar Cadastro"}
                  </button>
                  <div>
                    <button
                      type="button"
                      className="identity-correctionButton"
                      disabled={!canSendRejected || submitting}
                      onClick={() => void handleSolicitarCorrecao()}
                    >
                      <span aria-hidden="true">
                        <IdentityIcon name="correction" />
                      </span>
                      Solicitar Correção
                    </button>
                    <button
                      className="identity-rejectButton"
                      type="button"
                      disabled={!canSendRejected || submitting}
                      onClick={() => void handleReprovar()}
                    >
                      <span aria-hidden="true">
                        <IdentityIcon name="reject" />
                      </span>
                      Reprovar
                    </button>
                  </div>
                </footer>
              </>
            )}
          </aside>
        </>
      ) : null}

      {preview ? (
        <button
          className="identity-preview"
          type="button"
          aria-label="Fechar preview"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt="Preview do documento" />
        </button>
      ) : null}
    </section>
  );
}
