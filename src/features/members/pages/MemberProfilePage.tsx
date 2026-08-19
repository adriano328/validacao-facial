import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  obterMembroPorId,
  type UsuarioResponse,
} from "@features/user/api/userApi";
import { getTipoUsuarioLabel } from "@features/user/model/permissions";
import { isRequestCanceled } from "@shared/utils/http";
import { formatarDataToBr } from "@shared/utils/formataData";
import { maskCPF, maskPhoneBR } from "@shared/utils/masks";
import "@features/user/pages/HomePage.css";
import "@features/user/pages/PersonalDataPage.css";
import "./MembersPage.css";

function formatLabel(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getImageSrc(value?: string | null): string | null {
  const photo = (value ?? "").trim();
  if (!photo) return null;
  if (photo.startsWith("data:image/") || /^https?:\/\//i.test(photo)) return photo;
  return `data:image/jpeg;base64,${photo}`;
}

function getInitials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "M";
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

function getCampoLabel(usuario: UsuarioResponse): string {
  return (
    usuario.campoEclesiastico?.nomeCampo ??
    (usuario.campoEclesiasticoId ? `Campo ${usuario.campoEclesiasticoId}` : "-")
  );
}

function getSituacaoLabel(value?: string | null): string {
  switch (value) {
    case "APROVADO":
      return "Aprovado";
    case "PENDENTE":
      return "Aguardando revisão";
    case "REANALISE":
      return "Em reanálise";
    case "CORRECAO_SOLICITADA":
      return "Correção solicitada";
    case "REPROVADO":
      return "Reprovado";
    default:
      return formatLabel(value);
  }
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="member-detailField">
      <span>{label}</span>
      <span>{value || "-"}</span>
    </div>
  );
}

export function MemberProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<UsuarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const userId = Number(id);

    if (!Number.isFinite(userId)) {
      setError("Membro inválido.");
      setLoading(false);
      return () => controller.abort();
    }

    async function loadMember() {
      try {
        setLoading(true);
        setError(null);
        const response = await obterMembroPorId(userId, controller.signal);
        setUsuario(response);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setUsuario(null);
        setError("Não foi possível carregar o membro.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadMember();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return <section className="portal-state">Carregando membro...</section>;
  }

  if (error || !usuario) {
    return (
      <section className="portal-state portal-state--error">
        {error ?? "Não foi possível carregar o membro."}
      </section>
    );
  }

  const foto = getImageSrc(usuario.foto);
  const fotoDocumento = getImageSrc(usuario.fotoDocumento);
  const situacaoUsuario = usuario.situacaoUsuario ?? "";

  return (
    <section className="portal-page member-profile" aria-labelledby="member-profile-title">
      <header className="portal-pageHeader member-profileHeader">
        <button
          className="member-backButton"
          type="button"
          onClick={() => navigate("/membros")}
        >
          Voltar
        </button>
        <h1 id="member-profile-title">Membro</h1>
        <p>Consulte as informações cadastrais do membro.</p>
      </header>

      <section className="personal-card member-profileCard">
        <div className="personal-formHeader">
          <div>
            <h2>Informações cadastrais</h2>
            <span>{getTipoUsuarioLabel(usuario.tipoUsuario)}</span>
          </div>

          <span className={`personal-status personal-status--${situacaoUsuario.toLowerCase()}`}>
            {getSituacaoLabel(situacaoUsuario)}
          </span>
        </div>

        <section className="member-profileHero">
          <div className="member-profileAvatar" aria-hidden="true">
            {foto ? <img src={foto} alt="" /> : <span>{getInitials(usuario.nome)}</span>}
          </div>
          <div>
            <h2>{usuario.nome}</h2>
            <span>{maskCPF(usuario.cpf ?? "")}</span>
          </div>
        </section>

        <section className="member-detailSection" aria-label="Dados pessoais">
          <h3>Dados pessoais</h3>
          <div className="member-detailGrid">
            <DetailField label="Nome" value={usuario.nome} />
            <DetailField label="CPF" value={maskCPF(usuario.cpf ?? "")} />
            <DetailField
              label="Data de nascimento"
              value={usuario.dataNascimento ? formatarDataToBr(usuario.dataNascimento) : "-"}
            />
            <DetailField label="Telefone" value={usuario.telefone ? maskPhoneBR(usuario.telefone) : "-"} />
            <DetailField label="E-mail" value={usuario.email} />
          </div>
        </section>

        <section className="member-detailSection" aria-label="Dados do vínculo">
          <h3>Dados do vínculo</h3>
          <div className="member-detailGrid">
            <DetailField label="Cargo" value={formatLabel(usuario.cargo)} />
            <DetailField label="Campo" value={getCampoLabel(usuario)} />
            <DetailField label="Situação" value={getSituacaoLabel(usuario.situacaoUsuario)} />
            <DetailField label="Status" value={formatLabel(usuario.status)} />
            <DetailField label="Perfil" value={getTipoUsuarioLabel(usuario.tipoUsuario)} />
          </div>
        </section>

        <section className="member-detailSection" aria-label="Documentação">
          <h3>Documentação</h3>
          <div className="member-mediaGrid">
            <button
              className="member-photoButton"
              type="button"
              onClick={() => foto && setPreview(foto)}
              disabled={!foto}
            >
              <span>Foto do membro</span>
              {foto ? <img src={foto} alt="Foto do membro" /> : <em>Sem foto</em>}
            </button>
            <button
              className="member-photoButton"
              type="button"
              onClick={() => fotoDocumento && setPreview(fotoDocumento)}
              disabled={!fotoDocumento}
            >
              <span>Foto do documento</span>
              {fotoDocumento ? (
                <img src={fotoDocumento} alt="Foto do documento" />
              ) : (
                <em>Sem documento</em>
              )}
            </button>
          </div>
        </section>
      </section>

      {preview ? (
        <button
          className="identity-preview"
          type="button"
          aria-label="Fechar preview"
          onClick={() => setPreview(null)}
        >
          <img src={preview} alt="Preview" />
        </button>
      ) : null}
    </section>
  );
}
