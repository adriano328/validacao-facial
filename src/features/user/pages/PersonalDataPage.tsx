import { useEffect, useMemo, useState } from "react";
import { DocumentPhotoField } from "@features/registration/ui/DocumentPhotoField";
import { FacePhotoField } from "@features/registration/ui/FacePhotoField";
import type { CargoUsuario } from "@features/registration/model/types";
import {
  atualizarMeusDados,
  obterMinhaUltimaAnalise,
  type CampoAnaliseUsuario,
  type UsuarioAnaliseItemRequest,
  type UsuarioAtualizarRequest,
} from "@features/user/api/userApi";
import { getTipoUsuarioLabel } from "@features/user/model/permissions";
import { useUserInfo } from "@features/user/model/UserInfoContext";
import { CARGOS_ECLESIASTICOS } from "@shared/data/cargos";
import { alerts } from "@shared/lib/swal";
import { DropdownField } from "@shared/ui/dropdown/DropdownField";
import { FormField } from "@shared/ui/form/FormField";
import { brDateToISO, formatarDataToBr } from "@shared/utils/formataData";
import { getDocumentMediaSrc } from "@shared/utils/documentMedia";
import { handleAxiosError } from "@shared/utils/messageErro";
import { maskCPF, maskDateBR, maskPhoneBR } from "@shared/utils/masks";
import { isValidCPF } from "@shared/utils/cpfValidator";
import "./HomePage.css";
import "./PersonalDataPage.css";

type PersonalForm = {
  nome: string;
  cpf: string;
  dataNascimento: string;
  cargo: CargoUsuario | undefined;
  telefone: string;
  email: string;
  foto: string;
  fotoDocumento: string;
};

type PersonalErrors = Partial<Record<keyof PersonalForm, string>>;
type TouchedState = Partial<Record<keyof PersonalForm, boolean>>;
type OriginalImages = Pick<PersonalForm, "foto" | "fotoDocumento">;

const CAMPOS_ANALISE_LABELS: Record<CampoAnaliseUsuario, string> = {
  FOTO: "Foto do membro",
  NOME: "Nome completo",
  CPF: "CPF",
  DATA_NASCIMENTO: "Data de nascimento",
  FOTO_DOCUMENTO: "Documento oficial",
};

const initialForm: PersonalForm = {
  nome: "",
  cpf: "",
  dataNascimento: "",
  cargo: undefined,
  telefone: "",
  email: "",
  foto: "",
  fotoDocumento: "",
};

function formatLabel(value?: string | null): string {
  if (!value) return "-";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getImageSrc(photo?: string | null): string {
  const value = (photo ?? "").trim();
  if (!value) return "";
  if (value.startsWith("data:image/") || /^https?:\/\//i.test(value)) return value;
  return `data:image/jpeg;base64,${value}`;
}

function formatDateToForm(value?: string | null): string {
  if (!value) return "";
  return formatarDataToBr(value);
}

function getCargo(value?: string | null): CargoUsuario | undefined {
  return CARGOS_ECLESIASTICOS.find((cargo) => cargo.value === value)?.value;
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDateBR(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;

  const [dd, mm, yyyy] = value.split("/").map(Number);
  const date = new Date(yyyy, mm - 1, dd);

  return (
    date.getFullYear() === yyyy &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd
  );
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function imagemNovaOuIndefinida(value: string, original: string): string | undefined {
  const atual = value.trim();

  if (!atual || atual === original.trim() || /^https?:\/\//i.test(atual)) {
    return undefined;
  }

  return atual;
}

function temNovaMidia(value: string, original: string): boolean {
  return imagemNovaOuIndefinida(value, original) !== undefined;
}

function validarFormulario(
  form: PersonalForm,
  podeEditarCadastro: boolean,
  camposReprovados: Set<CampoAnaliseUsuario>,
  originalImages: OriginalImages
): PersonalErrors {
  const errors: PersonalErrors = {};

  if (podeEditarCadastro) {
    if (!form.nome.trim()) {
      errors.nome = "Informe o nome.";
    }

    if (!form.cpf.trim()) {
      errors.cpf = "Informe o CPF.";
    } else if (!isValidCPF(form.cpf)) {
      errors.cpf = "CPF invalido.";
    }

    if (!form.dataNascimento.trim()) {
      errors.dataNascimento = "Informe a data.";
    } else if (!isValidDateBR(form.dataNascimento)) {
      errors.dataNascimento = "Data invalida.";
    }

    if (!form.fotoDocumento.trim()) {
      errors.fotoDocumento = "Envie a foto ou o PDF do documento.";
    } else if (
      camposReprovados.has("FOTO_DOCUMENTO") &&
      !temNovaMidia(form.fotoDocumento, originalImages.fotoDocumento)
    ) {
      errors.fotoDocumento = "Substitua a foto ou o PDF do documento apontado na análise.";
    }
  }

  if (!form.telefone.trim() || onlyDigits(form.telefone).length < 10) {
    errors.telefone = "Telefone invalido.";
  }

  if (!form.email.trim() || !isValidEmail(form.email)) {
    errors.email = "E-mail invalido.";
  }

  if (!form.cargo) {
    errors.cargo = "Selecione o cargo.";
  }

  if (!form.foto.trim()) {
    errors.foto = "Envie a foto do membro.";
  } else if (
    podeEditarCadastro &&
    camposReprovados.has("FOTO") &&
    !temNovaMidia(form.foto, originalImages.foto)
  ) {
    errors.foto = "Tire novamente a foto do membro apontada na análise.";
  }

  return errors;
}

export function PersonalDataPage() {
  const { usuario, loading, error, recarregarUsuario } = useUserInfo();
  const [form, setForm] = useState<PersonalForm>(initialForm);
  const [errors, setErrors] = useState<PersonalErrors>({});
  const [touched, setTouched] = useState<TouchedState>({});
  const [analysisItems, setAnalysisItems] = useState<UsuarioAnaliseItemRequest[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(true);
  const [originalImages, setOriginalImages] = useState({
    foto: "",
    fotoDocumento: "",
  });

  const situacaoUsuario = usuario?.situacaoUsuario ?? "";
  const aguardandoAnalise =
    situacaoUsuario === "PENDENTE" || situacaoUsuario === "REANALISE";
  const readonly = aguardandoAnalise || saving;
  const precisaCorrigir =
    situacaoUsuario === "REPROVADO" || situacaoUsuario === "CORRECAO_SOLICITADA";

  useEffect(() => {
    let active = true;

    setLoadingCurrentUser(true);
    recarregarUsuario().finally(() => {
      if (active) {
        setLoadingCurrentUser(false);
      }
    });

    return () => {
      active = false;
    };
  }, [recarregarUsuario]);

  useEffect(() => {
    if (!usuario) {
      return;
    }

    const foto = getImageSrc(usuario.foto);
    const fotoDocumento =
      getDocumentMediaSrc(usuario.fotoDocumento, usuario.fotoDocumentoContentType) ?? "";

    setForm({
      nome: usuario.nome ?? "",
      cpf: maskCPF(usuario.cpf ?? ""),
      dataNascimento: formatDateToForm(usuario.dataNascimento),
      cargo: getCargo(usuario.cargo),
      telefone: usuario.telefone ? maskPhoneBR(usuario.telefone) : "",
      email: usuario.email ?? "",
      foto,
      fotoDocumento,
    });
    setOriginalImages({ foto, fotoDocumento });
    setErrors({});
    setTouched({});
  }, [usuario]);

  useEffect(() => {
    if (!precisaCorrigir) {
      setAnalysisItems([]);
      setAnalysisLoading(false);
      return;
    }

    const controller = new AbortController();
    setAnalysisLoading(true);

    obterMinhaUltimaAnalise(controller.signal)
      .then((analise) => {
        setAnalysisItems(
          analise?.itens.filter(
            (item) => item.resultado === "REPROVADO" || !!item.observacao?.trim()
          ) ?? []
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAnalysisItems([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAnalysisLoading(false);
        }
      });

    return () => controller.abort();
  }, [precisaCorrigir, usuario?.id, situacaoUsuario]);

  const apontamentosPorCampo = useMemo(() => {
    const apontamentos = new Map<CampoAnaliseUsuario, UsuarioAnaliseItemRequest>();

    analysisItems.forEach((item) => {
      apontamentos.set(item.campo, item);
    });

    return apontamentos;
  }, [analysisItems]);

  const camposReprovados = useMemo(
    () => new Set<CampoAnaliseUsuario>(analysisItems.map((item) => item.campo)),
    [analysisItems]
  );

  function setField<K extends keyof PersonalForm>(field: K, value: PersonalForm[K]) {
    setForm((current) => {
      const nextForm = { ...current, [field]: value };

      if (touched[field] || errors[field]) {
        const fieldError = validarFormulario(
          nextForm,
          precisaCorrigir,
          camposReprovados,
          originalImages
        )[field];
        setErrors((currentErrors) => {
          const nextErrors = { ...currentErrors };

          if (fieldError) {
            nextErrors[field] = fieldError;
          } else {
            delete nextErrors[field];
          }

          return nextErrors;
        });
      }

      return nextForm;
    });
  }

  function validateField(field: keyof PersonalForm) {
    setTouched((current) => ({ ...current, [field]: true }));

    const fieldError = validarFormulario(
      form,
      precisaCorrigir,
      camposReprovados,
      originalImages
    )[field];

    setErrors((current) => {
      const next = { ...current };

      if (fieldError) {
        next[field] = fieldError;
      } else {
        delete next[field];
      }

      return next;
    });
  }

  function inputClass(field: keyof PersonalForm) {
    return [
      "vf-input",
      "personal-input",
      errors[field] ? "personal-input--invalid" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  function handleCargoChange(cargo: CargoUsuario) {
    const nextForm = { ...form, cargo };
    const fieldError = validarFormulario(
      nextForm,
      precisaCorrigir,
      camposReprovados,
      originalImages
    ).cargo;

    setForm(nextForm);
    setTouched((current) => ({ ...current, cargo: true }));
    setErrors((current) => {
      const next = { ...current };

      if (fieldError) {
        next.cargo = fieldError;
      } else {
        delete next.cargo;
      }

      return next;
    });
  }

  function renderApontamento(campo: CampoAnaliseUsuario) {
    const item = apontamentosPorCampo.get(campo);

    if (!item) {
      return null;
    }

    return (
      <span className="personal-reviewNote">
        {item.observacao?.trim() || "Informacao reprovada na analise."}
      </span>
    );
  }

  async function handleSalvar() {
    if (!usuario || saving || aguardandoAnalise) return;

    const nextErrors = validarFormulario(
      form,
      precisaCorrigir,
      camposReprovados,
      originalImages
    );
    setErrors(nextErrors);
    setTouched({
      nome: true,
      cpf: true,
      dataNascimento: true,
      cargo: true,
      telefone: true,
      email: true,
      foto: true,
      fotoDocumento: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      alerts.warn({ text: "Revise as informacoes antes de salvar." });
      return;
    }

    const foto = imagemNovaOuIndefinida(form.foto, originalImages.foto);
    const fotoDocumento = imagemNovaOuIndefinida(
      form.fotoDocumento,
      originalImages.fotoDocumento
    );

    const payload: UsuarioAtualizarRequest = {
      cargo: form.cargo,
      telefone: form.telefone,
      email: form.email.trim(),
      foto,
    };

    if (precisaCorrigir) {
      payload.nome = form.nome.trim();
      payload.cpf = onlyDigits(form.cpf);
      payload.dataNascimento = brDateToISO(form.dataNascimento) ?? undefined;
      payload.fotoDocumento = fotoDocumento;
    }

    try {
      setSaving(true);
      alerts.loading({ title: "Salvando dados..." });

      await atualizarMeusDados(payload);
      await recarregarUsuario();
      setAnalysisItems([]);

      await alerts.success({
        title: "Dados salvos",
        text: precisaCorrigir
          ? "Seu cadastro foi enviado para reanálise."
          : "Suas informacoes foram atualizadas.",
      });
    } catch (err) {
      alerts.error({ text: handleAxiosError(err) });
    } finally {
      setSaving(false);
    }
  }

  if (loading || loadingCurrentUser) {
    return <section className="portal-state">Carregando dados pessoais...</section>;
  }

  if (error || !usuario) {
    return (
      <section className="portal-state portal-state--error">
        {error ?? "Nao foi possivel carregar seus dados."}
      </section>
    );
  }

  return (
    <section className="portal-page" aria-labelledby="personal-title">
      <header className="portal-pageHeader">
        <h1 id="personal-title">Dados Pessoais</h1>
        <p>Atualize suas informacoes cadastrais vinculadas ao sistema COMADEMAT.</p>
      </header>

      <section className="personal-card">
        <div className="personal-formHeader">
          <div>
            <h2>Informacoes cadastrais</h2>
            <span>{getTipoUsuarioLabel(usuario.tipoUsuario)}</span>
          </div>

          <span className={`personal-status personal-status--${situacaoUsuario.toLowerCase()}`}>
            {getSituacaoLabel(situacaoUsuario)}
          </span>
        </div>

        {precisaCorrigir ? (
          <section className="personal-analysis" aria-label="Apontamentos da analise">
            <div>
              <h3>Apontamentos da analise</h3>
              <p>
                Corrija os campos indicados e salve para enviar o cadastro para
                reanálise.
              </p>
            </div>

            {analysisLoading ? (
              <span className="personal-analysisEmpty">Carregando apontamentos...</span>
            ) : analysisItems.length > 0 ? (
              <ul className="personal-analysisList">
                {analysisItems.map((item) => (
                  <li key={item.campo}>
                    <span>{CAMPOS_ANALISE_LABELS[item.campo]}</span>
                    <p>{item.observacao?.trim() || "Informacao reprovada."}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="personal-analysisEmpty">
                Nenhum apontamento retornado para esta analise.
              </span>
            )}
          </section>
        ) : null}

        {aguardandoAnalise ? (
          <section className="personal-readonlyNotice" aria-label="Cadastro em revisao">
            <h3>{situacaoUsuario === "REANALISE" ? "Cadastro em reanálise" : "Cadastro em revisão"}</h3>
            <p>
              Suas informacoes foram enviadas para analise. Enquanto a verificacao
              estiver pendente, esta tela fica disponivel apenas para consulta.
            </p>
          </section>
        ) : null}

        <div className="personal-media">
          <FacePhotoField
            label="Foto do membro"
            value={form.foto}
            onChange={(base64) => setField("foto", base64)}
            disabled={readonly}
            required
            error={errors.foto}
          />
          {renderApontamento("FOTO")}
        </div>

        <div className="personal-form">
          <FormField label="Nome" required={precisaCorrigir} error={errors.nome}>
            <input
              className={inputClass("nome")}
              value={form.nome}
              disabled={!precisaCorrigir || readonly}
              aria-invalid={!!errors.nome}
              onChange={(event) => setField("nome", event.target.value)}
              onBlur={() => validateField("nome")}
            />
            {renderApontamento("NOME")}
          </FormField>

          <FormField label="CPF" required={precisaCorrigir} error={errors.cpf}>
            <input
              className={inputClass("cpf")}
              value={form.cpf}
              disabled={!precisaCorrigir || readonly}
              aria-invalid={!!errors.cpf}
              inputMode="numeric"
              onChange={(event) => setField("cpf", maskCPF(event.target.value))}
              onBlur={() => validateField("cpf")}
            />
            {renderApontamento("CPF")}
          </FormField>

          <FormField
            label="Data de nascimento"
            required={precisaCorrigir}
            error={errors.dataNascimento}
          >
            <input
              className={inputClass("dataNascimento")}
              value={form.dataNascimento}
              disabled={!precisaCorrigir || readonly}
              aria-invalid={!!errors.dataNascimento}
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
              onChange={(event) =>
                setField("dataNascimento", maskDateBR(event.target.value))
              }
              onBlur={() => validateField("dataNascimento")}
            />
            {renderApontamento("DATA_NASCIMENTO")}
          </FormField>

          <FormField label="Cargo" required error={errors.cargo}>
            <DropdownField
              value={form.cargo}
              placeholder="Selecione o cargo"
              options={CARGOS_ECLESIASTICOS}
              onChange={(cargo) => handleCargoChange(cargo as CargoUsuario)}
              disabled={readonly}
              invalid={!!errors.cargo}
            />
          </FormField>

          <FormField label="Telefone" required error={errors.telefone}>
            <input
              className={inputClass("telefone")}
              value={form.telefone}
              disabled={readonly}
              aria-invalid={!!errors.telefone}
              placeholder="(00) 00000-0000"
              inputMode="numeric"
              onChange={(event) => setField("telefone", maskPhoneBR(event.target.value))}
              onBlur={() => validateField("telefone")}
            />
          </FormField>

          <FormField label="E-mail" required error={errors.email}>
            <input
              className={inputClass("email")}
              value={form.email}
              disabled={readonly}
              aria-invalid={!!errors.email}
              placeholder="email@dominio.com"
              inputMode="email"
              autoCapitalize="none"
              onChange={(event) => setField("email", event.target.value)}
              onBlur={() => validateField("email")}
            />
          </FormField>

          <FormField label="Perfil">
            <input
              className="vf-input personal-input"
              value={getTipoUsuarioLabel(usuario.tipoUsuario)}
              disabled
              readOnly
            />
          </FormField>
        </div>

        {precisaCorrigir ? (
          <div className="personal-media">
            <DocumentPhotoField
              label="Foto do documento"
              documentType="RG"
              value={form.fotoDocumento}
              onChange={(base64) => setField("fotoDocumento", base64)}
              disabled={readonly}
              required
              error={errors.fotoDocumento}
            />
            {renderApontamento("FOTO_DOCUMENTO")}
          </div>
        ) : null}

        <footer className="personal-actions">
          <button
            className="vf-button vf-button--primary personal-submit"
            type="button"
            onClick={handleSalvar}
            disabled={readonly}
          >
            {saving ? "Salvando..." : "Salvar alteracoes"}
          </button>
        </footer>
      </section>
    </section>
  );
}
