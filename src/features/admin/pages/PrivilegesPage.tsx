import { useEffect, useMemo, useState } from "react";
import {
  alterarTipoUsuario,
  listarUsuariosPrivilegios,
  type PageResponse,
  type UsuarioResponse,
} from "@features/user/api/userApi";
import {
  getTipoUsuarioLabel,
  normalizeTipoUsuario,
  type TipoUsuario,
} from "@features/user/model/permissions";
import { alerts } from "@shared/lib/swal";
import { isRequestCanceled } from "@shared/utils/http";
import { maskCPF } from "@shared/utils/masks";
import "@features/user/pages/HomePage.css";
import "./PrivilegesPage.css";

const pageSize = 8;

const roles: Array<{
  value: TipoUsuario;
  title: string;
  description: string;
}> = [
  {
    value: "VOTANTE",
    title: "Votante",
    description: "Acesso padrão às funcionalidades do membro.",
  },
  {
    value: "MEMBRO_CPE",
    title: "Membro CPE",
    description: "Pode realizar confirmação de identidade.",
  },
  {
    value: "ADMIN_CPE",
    title: "Admin CPE",
    description: "Pode realizar confirmações e gerenciar privilégios.",
  },
];

function getImageSrc(value?: string | null): string | null {
  const photo = (value ?? "").trim();
  if (!photo) return null;
  if (photo.startsWith("data:image/") || /^https?:\/\//i.test(photo)) return photo;
  return `data:image/jpeg;base64,${photo}`;
}

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export function PrivilegesPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<UsuarioResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<TipoUsuario>("VOTANTE");
  const [saving, setSaving] = useState(false);

  async function loadUsers(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);
      const response = await listarUsuariosPrivilegios(
        page,
        pageSize,
        search.trim(),
        signal
      );
      setData(response);
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return;

      setData(null);
      setError("Não foi possível carregar os membros.");
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
  }, [page, search]);

  const filteredUsers = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    const searchDigits = search.replace(/\D/g, "");

    return (data?.content ?? []).filter((usuario) => {
      if (!searchText) return true;
      return (
        usuario.nome.toLowerCase().includes(searchText) ||
        usuario.cpf.replace(/\D/g, "").includes(searchDigits)
      );
    });
  }, [data?.content, search]);

  function openDialog(usuario?: UsuarioResponse) {
    const nextUser = usuario ?? filteredUsers[0] ?? null;
    setSelectedUser(nextUser);
    setSelectedRole(normalizeTipoUsuario(nextUser?.tipoUsuario));
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setSelectedUser(null);
    setSelectedRole("VOTANTE");
  }

  async function handleSave() {
    if (!selectedUser || saving) return;

    if (selectedRole === normalizeTipoUsuario(selectedUser.tipoUsuario)) {
      await alerts.warn({ text: "Nenhuma alteração de perfil foi realizada." });
      return;
    }

    try {
      setSaving(true);
      alerts.loading({
        title: "Salvando alteração...",
        text: "Atualizando perfil de acesso.",
      });
      await alterarTipoUsuario(selectedUser.id, selectedRole);
      alerts.close();
      await alerts.success({ text: "Perfil alterado com sucesso." });
      closeDialog();
      await loadUsers();
    } catch {
      alerts.close();
      await alerts.error({ text: "Não foi possível alterar o perfil." });
    } finally {
      setSaving(false);
    }
  }

  const totalPages = data?.totalPages ?? 0;
  const hasChange =
    selectedUser &&
    selectedRole !== normalizeTipoUsuario(selectedUser.tipoUsuario);

  return (
    <section className="portal-page privileges-page" aria-labelledby="privileges-title">
      <header className="portal-pageHeader">
        <h1 id="privileges-title">Gestão de Privilégios</h1>
        <p>Gerencie os níveis de acesso administrativo dos membros.</p>
      </header>

      <section className="privileges-toolbar">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder="Buscar membro por nome ou CPF..."
        />
        <button type="button" onClick={() => openDialog()}>
          + Gerenciar privilégio
        </button>
      </section>

      <section className="privileges-tableCard">
        {loading ? (
          <div className="portal-state">Carregando membros...</div>
        ) : error ? (
          <div className="portal-state portal-state--error">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="privileges-empty">
            <strong>Nenhum membro encontrado</strong>
            <span>Ajuste a busca para localizar outro cadastro.</span>
          </div>
        ) : (
          <div className="privileges-tableWrap">
            <table className="privileges-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Perfil</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((usuario) => {
                  const photo = getImageSrc(usuario.foto);
                  return (
                    <tr key={usuario.id}>
                      <td>
                        <div className="privileges-userCell">
                          <span className="privileges-avatar">
                            {photo ? (
                              <img src={photo} alt="" />
                            ) : (
                              getInitials(usuario.nome)
                            )}
                          </span>
                          <span className="privileges-userName">{usuario.nome}</span>
                        </div>
                      </td>
                      <td>{maskCPF(usuario.cpf ?? "")}</td>
                      <td>
                        <span className={`privileges-role is-${normalizeTipoUsuario(usuario.tipoUsuario).toLowerCase()}`}>
                          {getTipoUsuarioLabel(usuario.tipoUsuario)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="privileges-rowAction"
                          type="button"
                          onClick={() => openDialog(usuario)}
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="privileges-pagination">
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

      {dialogOpen ? (
        <div className="privileges-dialogLayer" role="dialog" aria-modal="true" aria-labelledby="privileges-dialog-title">
          <button
            className="privileges-dialogBackdrop"
            type="button"
            aria-label="Fechar"
            onClick={closeDialog}
          />
          <section className="privileges-dialog">
            <header>
              <h2 id="privileges-dialog-title">Gerenciar privilégio</h2>
              <button type="button" onClick={closeDialog} aria-label="Fechar">
                ×
              </button>
            </header>

            <div className="privileges-selectedMember">
              <span>Membro</span>
              {selectedUser ? (
                <>
                  <span className="privileges-selectedName">{selectedUser.nome}</span>
                  <em>CPF: {maskCPF(selectedUser.cpf ?? "")}</em>
                </>
              ) : (
                <span className="privileges-selectedName">Nenhum membro selecionado</span>
              )}
            </div>

            <fieldset className="privileges-radioGroup">
              <legend>Perfil de acesso</legend>
              {roles.map((role) => (
                <label key={role.value}>
                  <input
                    type="radio"
                    name="tipoUsuario"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={() => setSelectedRole(role.value)}
                  />
                  <span>
                    <span className="privileges-roleTitle">{role.title}</span>
                    <em>{role.description}</em>
                  </span>
                </label>
              ))}
            </fieldset>

            <footer>
              <button type="button" onClick={closeDialog}>
                Cancelar
              </button>
              <button
                className="privileges-saveButton"
                type="button"
                disabled={!selectedUser || !hasChange || saving}
                onClick={() => void handleSave()}
              >
                {saving ? "Salvando..." : "Salvar alteração"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
