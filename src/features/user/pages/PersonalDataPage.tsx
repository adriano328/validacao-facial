import { getTipoUsuarioLabel } from "@features/user/model/permissions";
import { useUserInfo } from "@features/user/model/UserInfoContext";
import { maskCPF, maskPhoneBR } from "@shared/utils/masks";
import "./HomePage.css";
import "./PersonalDataPage.css";

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

function formatLabel(value?: string | null): string {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getImageSrc(photo?: string | null): string | null {
  const value = (photo ?? "").trim();
  if (!value) return null;
  if (value.startsWith("data:image/") || /^https?:\/\//i.test(value)) return value;
  return `data:image/jpeg;base64,${value}`;
}

export function PersonalDataPage() {
  const { usuario, loading, error } = useUserInfo();

  if (loading) {
    return <section className="portal-state">Carregando dados pessoais...</section>;
  }

  if (error || !usuario) {
    return (
      <section className="portal-state portal-state--error">
        {error ?? "Não foi possível carregar seus dados."}
      </section>
    );
  }

  const photo = getImageSrc(usuario.foto);
  const fields = [
    { label: "Nome", value: usuario.nome, readonly: true },
    { label: "CPF", value: maskCPF(usuario.cpf ?? ""), readonly: true },
    { label: "Data de nascimento", value: formatDate(usuario.dataNascimento), readonly: true },
    { label: "Cargo", value: formatLabel(usuario.cargo), readonly: true },
    { label: "Telefone", value: usuario.telefone ? maskPhoneBR(usuario.telefone) : "-", readonly: false },
    { label: "E-mail", value: usuario.email ?? "-", readonly: false },
    { label: "Perfil", value: getTipoUsuarioLabel(usuario.tipoUsuario), readonly: true },
  ];

  return (
    <section className="portal-page" aria-labelledby="personal-title">
      <header className="portal-pageHeader">
        <h1 id="personal-title">Dados Pessoais</h1>
        <p>Consulte suas informações cadastrais vinculadas ao sistema COMADEMAT.</p>
      </header>

      <section className="personal-card">
        <div className="personal-photo">
          {photo ? <img src={photo} alt={`Foto de ${usuario.nome}`} /> : <span>Sem foto</span>}
        </div>

        <div className="personal-grid">
          {fields.map((field) => (
            <div className="personal-field" key={field.label}>
              <span>{field.label}</span>
              <strong>{field.value || "-"}</strong>
              {field.readonly ? <em>Somente leitura</em> : null}
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
