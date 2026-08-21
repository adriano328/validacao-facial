import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarMembros,
  type PageResponse,
  type UsuarioResponse,
} from "@features/user/api/userApi";
import { getTipoUsuarioLabel } from "@features/user/model/permissions";
import { CARGOS_ECLESIASTICOS } from "@shared/data/cargos";
import { MemberAvatar } from "@shared/ui/member-avatar/MemberAvatar";
import { isRequestCanceled } from "@shared/utils/http";
import { maskCPF } from "@shared/utils/masks";
import "@features/user/pages/HomePage.css";
import "@features/identity/pages/IdentityConfirmationPage.css";
import "./MembersPage.css";

const pageSize = 8;

const situacaoOptions = [
  { value: "SITUACAO:APROVADO", label: "Aprovado" },
  { value: "SITUACAO:PENDENTE", label: "Pendente" },
  { value: "SITUACAO:REANALISE", label: "Reanálise" },
  { value: "SITUACAO:CORRECAO_SOLICITADA", label: "Correção solicitada" },
  { value: "SITUACAO:REPROVADO", label: "Reprovado" },
  { value: "STATUS:ATIVO", label: "Ativo" },
  { value: "STATUS:INATIVO", label: "Inativo" },
];

function formatLabel(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getCampoLabel(usuario: UsuarioResponse): string {
  return (
    usuario.campoEclesiastico?.nomeCampo ??
    (usuario.campoEclesiasticoId ? `Campo ${usuario.campoEclesiasticoId}` : "-")
  );
}

function getSituacao(usuario: UsuarioResponse): string {
  return usuario.situacaoUsuario ?? usuario.status ?? "";
}

function getSituacaoLabel(value?: string | null): string {
  switch (value) {
    case "APROVADO":
      return "Aprovado";
    case "PENDENTE":
      return "Pendente";
    case "REANALISE":
      return "Reanálise";
    case "CORRECAO_SOLICITADA":
      return "Correção solicitada";
    case "REPROVADO":
      return "Reprovado";
    default:
      return formatLabel(value);
  }
}

function getStatusClass(value?: string | null): string {
  return String(value ?? "pendente").toLowerCase();
}

function getFiltroSituacao(value: string): { status?: string; situacao?: string } {
  if (!value) return {};
  const [tipo, filtro] = value.split(":");

  if (tipo === "STATUS") {
    return { status: filtro };
  }

  return { situacao: filtro };
}

export function MembersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<UsuarioResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cargo, setCargo] = useState("");
  const [situacao, setSituacao] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadMembers() {
      try {
        setLoading(true);
        setError(null);

        const response = await listarMembros(
          page,
          pageSize,
          {
            busca: search.trim(),
            cargo,
            ...getFiltroSituacao(situacao),
          },
          controller.signal
        );

        setData(response);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setData(null);
        setError("Não foi possível carregar os membros.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadMembers();

    return () => controller.abort();
  }, [cargo, page, search, situacao]);

  const totalPages = data?.totalPages ?? 0;
  const members = data?.content ?? [];

  return (
    <section className="portal-page members-page" aria-labelledby="members-title">
      <header className="portal-pageHeader">
        <h1 id="members-title">Membros</h1>
        <p>Consulte os membros cadastrados na plataforma.</p>
      </header>

      <section className="identity-toolbar members-toolbar" aria-label="Filtros de membros">
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
          value={situacao}
          onChange={(event) => {
            setSituacao(event.target.value);
            setPage(0);
          }}
        >
          <option value="">Todos os status</option>
          {situacaoOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </section>

      <section className="identity-tableCard">
        {loading ? (
          <div className="portal-state">Carregando membros...</div>
        ) : error ? (
          <div className="portal-state portal-state--error">{error}</div>
        ) : members.length === 0 ? (
          <div className="identity-empty">
            <strong>Nenhum membro encontrado</strong>
            <span>Ajuste os filtros para consultar outros cadastros.</span>
          </div>
        ) : (
          <div className="identity-tableWrap">
            <table className="identity-table members-table">
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>CPF</th>
                  <th>Cargo</th>
                  <th>Campo</th>
                  <th>Situação</th>
                  <th>Perfil</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {members.map((usuario) => {
                  const situacaoUsuario = getSituacao(usuario);

                  return (
                    <tr key={usuario.id}>
                      <td>
                        <div className="members-userCell">
                          <MemberAvatar
                            className="members-avatar"
                            src={usuario.foto}
                            fallback={usuario.nome}
                            size="sm"
                          />
                          <span className="identity-tableName">{usuario.nome}</span>
                        </div>
                      </td>
                      <td>{maskCPF(usuario.cpf ?? "")}</td>
                      <td>{formatLabel(usuario.cargo)}</td>
                      <td>{getCampoLabel(usuario)}</td>
                      <td>
                        <span className={`portal-badge portal-badge--${getStatusClass(situacaoUsuario)}`}>
                          {getSituacaoLabel(situacaoUsuario)}
                        </span>
                      </td>
                      <td>{getTipoUsuarioLabel(usuario.tipoUsuario)}</td>
                      <td>
                        <button
                          className="identity-actionButton"
                          type="button"
                          onClick={() => navigate(`/membros/${usuario.id}`)}
                        >
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
    </section>
  );
}
