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
import { maskCPF, maskPhoneBR } from "@shared/utils/masks";
import "@features/user/pages/HomePage.css";
import "./IdentityConfirmationPage.css";

type EvaluationStatus = "pendente" | "aprovado" | "reprovado";
type EvaluationKey = "foto" | "nome" | "cpf" | "dataNascimento" | "fotoDocumento";

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
  { value: "CORRECAO_SOLICITADA", label: "Correção solicitada" },
];

const initialEvaluations: Evaluations = {
  foto: { status: "pendente", observacao: "" },
  nome: { status: "pendente", observacao: "" },
  cpf: { status: "pendente", observacao: "" },
  dataNascimento: { status: "pendente", observacao: "" },
  fotoDocumento: { status: "pendente", observacao: "" },
};

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
          situacao: status,
        },
        signal
      );
      setData(response);
    } catch {
      setData(null);
      setError("Não foi possível carregar os cadastros.");
    } finally {
      setLoading(false);
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
  const canSendRejected = hasRejectedWithObservation(evaluations);
  const facePhoto = getImageSrc(selectedUser?.foto);
  const documentPhoto = getImageSrc(selectedUser?.fotoDocumento);

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
                    <span>Status atual</span>
                    <strong>{formatLabel(getCadastroStatus(selectedUser))}</strong>
                  </section>

                  <section className="identity-drawerCard">
                    <h3>Dados do membro</h3>
                    <div className="identity-memberGrid">
                      <div>
                        <span>Nome completo</span>
                        <strong>{selectedUser.nome}</strong>
                      </div>
                      <div>
                        <span>CPF</span>
                        <strong>{maskCPF(selectedUser.cpf ?? "")}</strong>
                      </div>
                      <div>
                        <span>Data de nascimento</span>
                        <strong>{formatDate(selectedUser.dataNascimento)}</strong>
                      </div>
                      <div>
                        <span>Cargo vinculado</span>
                        <strong>{formatLabel(selectedUser.cargo)}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="identity-drawerCard">
                    <h3>Documentação</h3>
                    <p>Verifique se a foto do membro corresponde ao documento oficial.</p>
                    <div className="identity-docGrid">
                      <button type="button" onClick={() => facePhoto && setPreview(facePhoto)}>
                        {facePhoto ? <img src={facePhoto} alt="Foto do membro" /> : <span>Sem foto</span>}
                        <strong>Foto do membro</strong>
                      </button>
                      <button type="button" onClick={() => documentPhoto && setPreview(documentPhoto)}>
                        {documentPhoto ? <img src={documentPhoto} alt="Foto do documento" /> : <span>Sem documento</span>}
                        <strong>Foto do documento</strong>
                      </button>
                    </div>
                  </section>

                  <section className="identity-drawerCard">
                    <h3>Validação individual</h3>
                    <div className="identity-evaluationList">
                      {(Object.keys(evaluationLabels) as EvaluationKey[]).map((key) => {
                        const item = evaluations[key];
                        return (
                          <div className="identity-evaluationItem" key={key}>
                            <div className="identity-evaluationHeader">
                              <strong>{evaluationLabels[key]}</strong>
                              <span className={`identity-evaluationStatus is-${item.status}`}>
                                {formatLabel(item.status)}
                              </span>
                            </div>

                            <div className="identity-evaluationActions">
                              <button
                                type="button"
                                className={item.status === "aprovado" ? "is-selected" : ""}
                                onClick={() => setEvaluationStatus(key, "aprovado")}
                              >
                                Aprovado
                              </button>
                              <button
                                type="button"
                                className={item.status === "reprovado" ? "is-selected is-danger" : ""}
                                onClick={() => setEvaluationStatus(key, "reprovado")}
                              >
                                Reprovado
                              </button>
                            </div>

                            {item.status === "reprovado" ? (
                              <label className="identity-note">
                                Motivo *
                                <textarea
                                  value={item.observacao}
                                  onChange={(event) => setEvaluationNote(key, event.target.value)}
                                  placeholder="Descreva o motivo da reprovação deste atributo."
                                />
                              </label>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                <footer className="identity-drawerFooter">
                  <button
                    className="identity-approveButton"
                    type="button"
                    disabled={!canApprove || submitting}
                    onClick={() => void handleApprove()}
                  >
                    {submitting ? "Aprovando..." : "Aprovar Cadastro"}
                  </button>
                  <div>
                    <button
                      type="button"
                      disabled={!canSendRejected || submitting}
                      onClick={() => void handleSolicitarCorrecao()}
                    >
                      Solicitar Correção
                    </button>
                    <button
                      className="identity-rejectButton"
                      type="button"
                      disabled={!canSendRejected || submitting}
                      onClick={() => void handleReprovar()}
                    >
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
