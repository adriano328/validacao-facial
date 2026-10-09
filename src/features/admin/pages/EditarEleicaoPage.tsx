import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  atualizarEleicao,
  buscarEleicaoPorId,
  type Eleicao,
  type EleicaoPayload,
} from "@features/admin/api/eleicaoApi";
import {
  buscarEventoPorId,
  listarEventos,
  type Evento,
} from "@features/admin/api/eventoApi";
import {
  listarCargos,
  listarCargosOpcoes,
  TIPO_CARGO,
  type CargoResponse,
  type PageResponse,
} from "@features/admin/api/cargoApi";
import {
  atualizarOficialEleicao,
  cadastrarOficialEleicao,
  excluirOficialEleicao,
  listarOficiaisEleicao,
  type OficialEleicao,
  type OficialEleicaoPayload,
} from "@features/admin/api/oficialEleicaoApi";
import {
  atualizarCandidato,
  cadastrarCandidato,
  excluirCandidato,
  listarCandidatos,
  type Candidato,
  type CandidatoPayload,
} from "@features/admin/api/candidatoApi";
import {
  listarMembros,
  type UsuarioResponse,
} from "@features/user/api/userApi";
import {
  ClearFiltersButton,
  GestaoBackButton,
} from "@features/admin/ui/GestaoPageActions";
import { alerts } from "@shared/lib/swal";
import {
  DropdownField,
  type DropdownOption,
} from "@shared/ui/dropdown/DropdownField";
import { FormField } from "@shared/ui/form/FormField";
import { MemberAvatar } from "@shared/ui/member-avatar/MemberAvatar";
import { formatarDataToBr } from "@shared/utils/formataData";
import { isRequestCanceled } from "@shared/utils/http";
import { handleAxiosError } from "@shared/utils/messageErro";
import { maskCPF } from "@shared/utils/masks";
import "@features/user/pages/HomePage.css";
import "@features/identity/pages/IdentityConfirmationPage.css";
import "./EditarEleicaoPage.css";

const supportPageSize = 500;
const oficiaisPageSize = 10;
const candidatosPageSize = 10;
const membersPageSize = 20;
const searchDelayMs = 350;
const allFunctionsValue = 0;
const allCandidateCargosValue = 0;
const acceptedCandidatePhotoTypes = ["image/jpeg", "image/png"];
const periodoErrorMessage = "A data final não pode ser anterior à data inicial.";
const periodoEventoErrorMessage =
  "A data inicial da eleição deve estar dentro do período do evento.";
const votacaoAntesInicialMessage =
  "O início da votação não pode ser anterior à data inicial da eleição.";
const votacaoAposFinalMessage =
  "O início da votação não pode ser posterior à data final da eleição.";
const votacaoAposApuracaoMessage =
  "O início da votação não pode ser posterior ao início da apuração.";
const apuracaoPeriodoMessage =
  "A data de início da apuração deve estar dentro do período da eleição.";

type EleicaoForm = {
  eventoId?: number;
  dataInicial: string;
  dataFinal: string;
  dataInicioVotacao: string;
  dataInicioApuracao: string;
  dataCadastro: string;
  chavePublica: string;
  fingerprint: string;
  tamanhoBits: string;
};

type EleicaoFormErrors = Partial<Record<keyof EleicaoForm, string>>;

type OficialForm = {
  usuarioId?: number;
  cargoIdAdministrativo?: number;
};

type OficialFormErrors = Partial<Record<keyof OficialForm, string>>;

type CandidatoForm = {
  usuarioId?: number;
  cargoIdEletivo?: number;
  numero: string;
  foto: string | null;
  fotoContentType: string | null;
  removerFoto: boolean;
};

type CandidatoFormErrors = Partial<Record<keyof CandidatoForm, string>>;

type SelectedMemberReference = {
  usuarioId: number;
  nomeUsuario: string;
};

type OfficialCargoKey = "MESARIO" | "FISCAL";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function getOfficialCargoKey(cargoName?: string | null): OfficialCargoKey | null {
  const normalized = normalizeText(cargoName ?? "");

  if (normalized === "MESARIO") return "MESARIO";
  if (normalized === "FISCAL") return "FISCAL";

  return null;
}

function getOfficialCargoLabel(cargoName?: string | null) {
  const key = getOfficialCargoKey(cargoName);

  if (key === "MESARIO") return "Mesário";
  if (key === "FISCAL") return "Fiscal";

  return cargoName ?? "-";
}

function toDateTimeInput(value?: string | null) {
  if (!value) return "";

  const [datePart, timePart = ""] = value.split("T");
  const time = timePart.slice(0, 5);

  return time ? `${datePart}T${time}` : datePart;
}

function normalizeDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

function getVotacaoMax(form: EleicaoForm) {
  return form.dataFinal ? `${form.dataFinal}T23:59` : undefined;
}

function trimToNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formFromEleicao(eleicao: Eleicao): EleicaoForm {
  return {
    eventoId: eleicao.eventoId,
    dataInicial: eleicao.dataInicial,
    dataFinal: eleicao.dataFinal,
    dataInicioVotacao: toDateTimeInput(eleicao.dataInicioVotacao),
    dataInicioApuracao: toDateTimeInput(eleicao.dataInicioApuracao),
    dataCadastro: eleicao.dataCadastro,
    chavePublica: eleicao.chavePublica ?? "",
    fingerprint: eleicao.fingerprint ?? "",
    tamanhoBits: eleicao.tamanhoBits ? String(eleicao.tamanhoBits) : "",
  };
}

function toEleicaoPayload(form: EleicaoForm): EleicaoPayload {
  const tamanhoBits = form.tamanhoBits.trim();

  return {
    eventoId: form.eventoId!,
    dataInicial: form.dataInicial,
    dataFinal: form.dataFinal,
    dataInicioVotacao: normalizeDateTime(form.dataInicioVotacao),
    dataInicioApuracao: normalizeDateTime(form.dataInicioApuracao),
    chavePublica: trimToNull(form.chavePublica),
    fingerprint: trimToNull(form.fingerprint),
    tamanhoBits: tamanhoBits ? Number(tamanhoBits) : null,
    dataCadastro: form.dataCadastro,
  };
}

function toEventoOptions(eventos: Evento[]): DropdownOption<number>[] {
  return eventos.map((evento) => ({
    value: evento.eventoId,
    label: evento.nomeEvento,
  }));
}

function toMemberOptions(
  members: UsuarioResponse[],
  selectedMember?: SelectedMemberReference | null
): DropdownOption<number>[] {
  const options = members.map((member) => ({
    value: member.id,
    label: `${member.nome}${member.cpf ? ` - ${maskCPF(member.cpf)}` : ""}`,
  }));

  if (
    selectedMember &&
    !options.some((option) => option.value === selectedMember.usuarioId)
  ) {
    return [
      {
        value: selectedMember.usuarioId,
        label: selectedMember.nomeUsuario,
      },
      ...options,
    ];
  }

  return options;
}

function toCargoOptions(cargos: CargoResponse[]): DropdownOption<number>[] {
  return cargos.map((cargo) => ({
    value: cargo.cargoId,
    label: getOfficialCargoLabel(cargo.nomeCargo),
  }));
}

function toCandidateCargoOptions(
  cargos: CargoResponse[],
  selectedCandidato?: Candidato | null
): DropdownOption<number>[] {
  const options = cargos.map((cargo) => ({
    value: cargo.cargoId,
    label: cargo.nomeCargo,
  }));

  if (
    selectedCandidato &&
    !options.some((option) => option.value === selectedCandidato.cargoIdEletivo)
  ) {
    return [
      {
        value: selectedCandidato.cargoIdEletivo,
        label: selectedCandidato.nomeCargoEletivo,
      },
      ...options,
    ];
  }

  return options;
}

function isElectionStartInsideEvent(form: EleicaoForm, evento?: Evento | null) {
  if (!evento || !form.dataInicial) return true;

  return (
    form.dataInicial >= evento.dataInicial &&
    form.dataInicial <= evento.dataFinal
  );
}

function validateEleicaoForm(
  form: EleicaoForm,
  selectedEvento?: Evento | null
): EleicaoFormErrors {
  const errors: EleicaoFormErrors = {};

  if (!form.eventoId) {
    errors.eventoId = "O evento é obrigatório.";
  }

  if (!form.dataInicial) {
    errors.dataInicial = "A data inicial é obrigatória.";
  } else if (!isElectionStartInsideEvent(form, selectedEvento)) {
    errors.dataInicial = periodoEventoErrorMessage;
  }

  if (!form.dataFinal) {
    errors.dataFinal = "A data final é obrigatória.";
  } else if (form.dataInicial && form.dataFinal < form.dataInicial) {
    errors.dataFinal = periodoErrorMessage;
  }

  if (!form.dataInicioVotacao) {
    errors.dataInicioVotacao = "O início da votação é obrigatório.";
  } else if (
    form.dataInicial &&
    normalizeDateTime(form.dataInicioVotacao) < `${form.dataInicial}T00:00:00`
  ) {
    errors.dataInicioVotacao = votacaoAntesInicialMessage;
  } else if (
    form.dataFinal &&
    normalizeDateTime(form.dataInicioVotacao) > `${form.dataFinal}T23:59:59`
  ) {
    errors.dataInicioVotacao = votacaoAposFinalMessage;
  } else if (
    form.dataInicioApuracao &&
    normalizeDateTime(form.dataInicioVotacao) >
      normalizeDateTime(form.dataInicioApuracao)
  ) {
    errors.dataInicioVotacao = votacaoAposApuracaoMessage;
  }

  if (!form.dataInicioApuracao) {
    errors.dataInicioApuracao = "O início da apuração é obrigatório.";
  } else if (
    form.dataInicial &&
    form.dataFinal &&
    (normalizeDateTime(form.dataInicioApuracao) < `${form.dataInicial}T00:00:00` ||
      normalizeDateTime(form.dataInicioApuracao) > `${form.dataFinal}T23:59:59`)
  ) {
    errors.dataInicioApuracao = apuracaoPeriodoMessage;
  }

  if (!form.dataCadastro) {
    errors.dataCadastro = "A data de cadastro é obrigatória.";
  }

  return errors;
}

function validateOficialForm(form: OficialForm): OficialFormErrors {
  const errors: OficialFormErrors = {};

  if (!form.usuarioId) {
    errors.usuarioId = "O oficial é obrigatório.";
  }

  if (!form.cargoIdAdministrativo) {
    errors.cargoIdAdministrativo = "A função é obrigatória.";
  }

  return errors;
}

function validateCandidatoForm(form: CandidatoForm): CandidatoFormErrors {
  const errors: CandidatoFormErrors = {};
  const numero = Number(form.numero);

  if (!form.usuarioId) {
    errors.usuarioId = "O candidato é obrigatório.";
  }

  if (!form.cargoIdEletivo) {
    errors.cargoIdEletivo = "O cargo eletivo é obrigatório.";
  }

  if (!form.numero.trim()) {
    errors.numero = "O número é obrigatório.";
  } else if (!Number.isInteger(numero) || numero <= 0) {
    errors.numero = "Informe um número válido.";
  }

  return errors;
}

function hasErrors(
  errors: EleicaoFormErrors | OficialFormErrors | CandidatoFormErrors
) {
  return Object.values(errors).some(Boolean);
}

function getCandidatePhotoSrc(candidato?: Candidato | null) {
  return candidato?.fotoUrl?.trim() || null;
}

function readCandidatePhotoFile(
  file: File
): Promise<Pick<CandidatoForm, "foto" | "fotoContentType">> {
  return new Promise((resolve, reject) => {
    if (!acceptedCandidatePhotoTypes.includes(file.type)) {
      reject(new Error("Selecione uma imagem JPG ou PNG."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const [, base64 = ""] = result.split(",");

      resolve({
        foto: base64 || null,
        fotoContentType: file.type,
      });
    };
    reader.onerror = () => reject(new Error("Não foi possível carregar a foto."));
    reader.readAsDataURL(file);
  });
}

function SectionIcon({ type }: { type: "data" | "officers" | "candidates" }) {
  const paths = {
    data: "M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v12h12V6H6Zm2 2h8v2H8V8Zm0 4h8v2H8v-2Z",
    officers:
      "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.9 0-7 2-7 4.5V20h14v-1.5C19 16 15.9 14 12 14Z",
    candidates:
      "M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.5 13C5.5 13 3 14.7 3 17v1h11v-1c0-2.3-2.5-4-5.5-4Zm7 0c-.7 0-1.4.1-2 .3 1.3.9 2.1 2.2 2.1 3.7v1H21v-1c0-2.3-2.4-4-5.5-4Z",
  };

  return (
    <span className="editar-eleicao-sectionIcon" aria-hidden>
      <svg viewBox="0 0 24 24">
        <path d={paths[type]} />
      </svg>
    </span>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 17.3V20h2.7L17.8 8.9l-2.7-2.7L4 17.3Zm15.9-10.5a1 1 0 0 0 0-1.4l-1.3-1.3a1 1 0 0 0-1.4 0L16 5.3 18.7 8l1.2-1.2Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 11H7L6 9Zm3 2 .5 7h2L11 11H9Zm4 0-.5 7h2l.5-7h-2Z" />
    </svg>
  );
}

export function EditarEleicaoPage() {
  const params = useParams<{ eleicaoId: string }>();
  const eleicaoId = Number(params.eleicaoId);
  const hasValidEleicaoId = Number.isInteger(eleicaoId) && eleicaoId > 0;

  const [eleicao, setEleicao] = useState<Eleicao | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventosLoading, setEventosLoading] = useState(false);
  const [eventosError, setEventosError] = useState<string | null>(null);
  const [cargosOficiais, setCargosOficiais] = useState<CargoResponse[]>([]);
  const [cargosCandidatos, setCargosCandidatos] = useState<CargoResponse[]>([]);
  const [cargosLoading, setCargosLoading] = useState(false);
  const [cargosError, setCargosError] = useState<string | null>(null);
  const [form, setForm] = useState<EleicaoForm | null>(null);
  const [initialForm, setInitialForm] = useState<EleicaoForm | null>(null);
  const [formErrors, setFormErrors] = useState<EleicaoFormErrors>({});
  const [formTouched, setFormTouched] = useState<
    Partial<Record<keyof EleicaoForm, boolean>>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingEleicao, setSavingEleicao] = useState(false);

  const [oficiaisPage, setOficiaisPage] = useState(0);
  const [oficiaisData, setOficiaisData] =
    useState<PageResponse<OficialEleicao> | null>(null);
  const [oficiaisLoading, setOficiaisLoading] = useState(false);
  const [oficiaisError, setOficiaisError] = useState<string | null>(null);
  const [filterNomeUsuario, setFilterNomeUsuario] = useState("");
  const [debouncedFilterNomeUsuario, setDebouncedFilterNomeUsuario] = useState("");
  const [filterCargoId, setFilterCargoId] = useState(allFunctionsValue);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOficial, setSelectedOficial] = useState<OficialEleicao | null>(
    null
  );
  const [oficialForm, setOficialForm] = useState<OficialForm>({});
  const [oficialFormErrors, setOficialFormErrors] =
    useState<OficialFormErrors>({});
  const [oficialFormTouched, setOficialFormTouched] = useState<
    Partial<Record<keyof OficialForm, boolean>>
  >({});
  const [members, setMembers] = useState<UsuarioResponse[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [debouncedMemberSearch, setDebouncedMemberSearch] = useState("");
  const [savingOficial, setSavingOficial] = useState(false);
  const [deletingOficialId, setDeletingOficialId] = useState<number | null>(null);

  const [candidatosPage, setCandidatosPage] = useState(0);
  const [candidatosData, setCandidatosData] =
    useState<PageResponse<Candidato> | null>(null);
  const [candidatosLoading, setCandidatosLoading] = useState(false);
  const [candidatosError, setCandidatosError] = useState<string | null>(null);
  const [filterNomeCandidato, setFilterNomeCandidato] = useState("");
  const [debouncedFilterNomeCandidato, setDebouncedFilterNomeCandidato] =
    useState("");
  const [filterCargoCandidatoId, setFilterCargoCandidatoId] = useState(
    allCandidateCargosValue
  );
  const [filterNumeroCandidato, setFilterNumeroCandidato] = useState("");
  const [debouncedFilterNumeroCandidato, setDebouncedFilterNumeroCandidato] =
    useState("");
  const [candidatoDialogOpen, setCandidatoDialogOpen] = useState(false);
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(
    null
  );
  const [candidatoForm, setCandidatoForm] = useState<CandidatoForm>({
    numero: "",
    foto: null,
    fotoContentType: null,
    removerFoto: false,
  });
  const [candidatoFormErrors, setCandidatoFormErrors] =
    useState<CandidatoFormErrors>({});
  const [candidatoFormTouched, setCandidatoFormTouched] = useState<
    Partial<Record<keyof CandidatoForm, boolean>>
  >({});
  const [savingCandidato, setSavingCandidato] = useState(false);
  const [deletingCandidatoId, setDeletingCandidatoId] = useState<number | null>(
    null
  );

  const eventoOptions = useMemo(() => toEventoOptions(eventos), [eventos]);
  const selectedEvento = useMemo(
    () => eventos.find((evento) => evento.eventoId === form?.eventoId) ?? null,
    [eventos, form?.eventoId]
  );
  const cargoOptions = useMemo(
    () => toCargoOptions(cargosOficiais),
    [cargosOficiais]
  );
  const baseCargoCandidatoOptions = useMemo(
    () => toCandidateCargoOptions(cargosCandidatos),
    [cargosCandidatos]
  );
  const cargoCandidatoOptions = useMemo(
    () => toCandidateCargoOptions(cargosCandidatos, selectedCandidato),
    [cargosCandidatos, selectedCandidato]
  );
  const cargoFilterOptions = useMemo<DropdownOption<number>[]>(
    () => [
      { value: allFunctionsValue, label: "Todas as funções" },
      ...cargoOptions,
    ],
    [cargoOptions]
  );
  const cargoCandidatoFilterOptions = useMemo<DropdownOption<number>[]>(
    () => [
      { value: allCandidateCargosValue, label: "Todos os cargos" },
      ...baseCargoCandidatoOptions,
    ],
    [baseCargoCandidatoOptions]
  );
  const selectedMember = selectedOficial ?? selectedCandidato;
  const memberOptions = useMemo(
    () => toMemberOptions(members, selectedMember),
    [members, selectedMember]
  );
  const hasOfficialFilters = Boolean(
    filterNomeUsuario.trim() || filterCargoId !== allFunctionsValue
  );
  const hasCandidateFilters = Boolean(
    filterNomeCandidato.trim() ||
      filterCargoCandidatoId !== allCandidateCargosValue ||
      filterNumeroCandidato.trim()
  );
  const oficiais = oficiaisData?.content ?? [];
  const oficiaisTotalPages = oficiaisData?.totalPages ?? 0;
  const candidatos = candidatosData?.content ?? [];
  const candidatosTotalPages = candidatosData?.totalPages ?? 0;
  const dialogTitle = selectedOficial ? "Editar oficial" : "Adicionar oficial";
  const dialogSubtitle = selectedOficial
    ? "Atualize o oficial e sua função nesta eleição."
    : "Defina o oficial e sua função nesta eleição.";
  const candidatoDialogTitle = selectedCandidato
    ? "Editar candidato"
    : "Adicionar candidato";
  const candidatoDialogSubtitle = selectedCandidato
    ? "Atualize os dados do candidato nesta eleição."
    : "Defina o candidato, cargo eletivo, número e foto nesta eleição.";
  const candidatoPhotoPreview = candidatoForm.foto
    ? candidatoForm.fotoContentType
      ? `data:${candidatoForm.fotoContentType};base64,${candidatoForm.foto}`
      : candidatoForm.foto
    : null;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFilterNomeUsuario(filterNomeUsuario.trim());
      setOficiaisPage(0);
    }, searchDelayMs);

    return () => window.clearTimeout(timeout);
  }, [filterNomeUsuario]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFilterNomeCandidato(filterNomeCandidato.trim());
      setCandidatosPage(0);
    }, searchDelayMs);

    return () => window.clearTimeout(timeout);
  }, [filterNomeCandidato]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFilterNumeroCandidato(filterNumeroCandidato.trim());
      setCandidatosPage(0);
    }, searchDelayMs);

    return () => window.clearTimeout(timeout);
  }, [filterNumeroCandidato]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedMemberSearch(memberSearch.trim());
    }, searchDelayMs);

    return () => window.clearTimeout(timeout);
  }, [memberSearch]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEleicao() {
      if (!hasValidEleicaoId) {
        setLoading(false);
        setError("Eleição não encontrada.");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const eleicaoResponse = await buscarEleicaoPorId(
          eleicaoId,
          controller.signal
        );
        const eleicaoForm = formFromEleicao(eleicaoResponse);

        setEleicao(eleicaoResponse);
        setForm(eleicaoForm);
        setInitialForm(eleicaoForm);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setEleicao(null);
        setForm(null);
        setInitialForm(null);
        setError(handleAxiosError(requestError));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadEleicao();

    return () => controller.abort();
  }, [eleicaoId, hasValidEleicaoId]);

  useEffect(() => {
    if (!eleicao) return;

    const eleicaoAtual = eleicao;
    const controller = new AbortController();

    async function loadSupportData() {
      try {
        setEventosLoading(true);
        setCargosLoading(true);
        setEventosError(null);
        setCargosError(null);

        const [
          currentEvento,
          eventosResponse,
          cargosOficiaisResponse,
          cargosCandidatosResponse,
        ] = await Promise.all([
          buscarEventoPorId(eleicaoAtual.eventoId, controller.signal),
          listarEventos(
            0,
            supportPageSize,
            { convencaoId: eleicaoAtual.convencaoId },
            controller.signal
          ),
          listarCargos(
            0,
            supportPageSize,
            undefined,
            controller.signal,
            {
              convencaoId: eleicaoAtual.convencaoId,
              statusAtivo: true,
              tipoCargo: TIPO_CARGO.ADMINISTRATIVO,
            }
          ),
          listarCargosOpcoes(
            {
              convencaoId: eleicaoAtual.convencaoId,
              statusAtivo: true,
              tipoCargo: TIPO_CARGO.ELETIVOS,
            },
            controller.signal
          ),
        ]);

        const eventosDaConvencao = eventosResponse.content.some(
          (evento) => evento.eventoId === currentEvento.eventoId
        )
          ? eventosResponse.content
          : [currentEvento, ...eventosResponse.content];
        const oficiais = cargosOficiaisResponse.content.filter((cargo) =>
          Boolean(getOfficialCargoKey(cargo.nomeCargo))
        );

        setEventos(eventosDaConvencao);
        setCargosOficiais(oficiais);
        setCargosCandidatos(cargosCandidatosResponse);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setEventos([]);
        setCargosOficiais([]);
        setCargosCandidatos([]);
        setEventosError("Não foi possível carregar os eventos.");
        setCargosError("Não foi possível carregar os cargos.");
      } finally {
        if (!controller.signal.aborted) {
          setEventosLoading(false);
          setCargosLoading(false);
        }
      }
    }

    void loadSupportData();

    return () => controller.abort();
  }, [eleicao]);

  async function loadOficiais(nextPage = oficiaisPage, signal?: AbortSignal) {
    if (!hasValidEleicaoId) return;

    try {
      setOficiaisLoading(true);
      setOficiaisError(null);

      const response = await listarOficiaisEleicao(
        nextPage,
        oficiaisPageSize,
        {
          eleicaoId,
          nomeUsuario: debouncedFilterNomeUsuario,
          cargoIdAdministrativo:
            filterCargoId === allFunctionsValue ? undefined : filterCargoId,
        },
        signal
      );

      setOficiaisData(response);
      setOficiaisPage(response.number ?? nextPage);
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return;

      setOficiaisData(null);
      setOficiaisError(handleAxiosError(requestError));
    } finally {
      if (!signal?.aborted) {
        setOficiaisLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadOficiais(oficiaisPage, controller.signal);
    return () => controller.abort();
  }, [
    debouncedFilterNomeUsuario,
    eleicaoId,
    filterCargoId,
    hasValidEleicaoId,
    oficiaisPage,
  ]);

  async function loadCandidatos(nextPage = candidatosPage, signal?: AbortSignal) {
    if (!hasValidEleicaoId) return;

    const numero = debouncedFilterNumeroCandidato
      ? Number(debouncedFilterNumeroCandidato)
      : undefined;

    try {
      setCandidatosLoading(true);
      setCandidatosError(null);

      const response = await listarCandidatos(
        nextPage,
        candidatosPageSize,
        {
          eleicaoId,
          nomeUsuario: debouncedFilterNomeCandidato,
          cargoIdEletivo:
            filterCargoCandidatoId === allCandidateCargosValue
              ? undefined
              : filterCargoCandidatoId,
          numero:
            numero && Number.isInteger(numero) && numero > 0 ? numero : undefined,
        },
        signal
      );

      setCandidatosData(response);
      setCandidatosPage(response.number ?? nextPage);
    } catch (requestError) {
      if (isRequestCanceled(requestError)) return;

      setCandidatosData(null);
      setCandidatosError(handleAxiosError(requestError));
    } finally {
      if (!signal?.aborted) {
        setCandidatosLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void loadCandidatos(candidatosPage, controller.signal);
    return () => controller.abort();
  }, [
    candidatosPage,
    debouncedFilterNomeCandidato,
    debouncedFilterNumeroCandidato,
    eleicaoId,
    filterCargoCandidatoId,
    hasValidEleicaoId,
  ]);

  useEffect(() => {
    if (!dialogOpen && !candidatoDialogOpen) return;

    const controller = new AbortController();

    async function loadMembers() {
      try {
        setMembersLoading(true);
        const response = await listarMembros(
          0,
          membersPageSize,
          { busca: debouncedMemberSearch },
          controller.signal
        );

        setMembers(response.content);
      } catch (requestError) {
        if (isRequestCanceled(requestError)) return;

        setMembers([]);
      } finally {
        if (!controller.signal.aborted) {
          setMembersLoading(false);
        }
      }
    }

    void loadMembers();

    return () => controller.abort();
  }, [candidatoDialogOpen, debouncedMemberSearch, dialogOpen]);

  function updateEleicaoForm<K extends keyof EleicaoForm>(
    field: K,
    value: EleicaoForm[K]
  ) {
    setForm((current) => {
      if (!current) return current;

      const next = { ...current, [field]: value };
      const nextEvento =
        field === "eventoId"
          ? eventos.find((evento) => evento.eventoId === value)
          : selectedEvento;

      if (formTouched[field]) {
        setFormErrors(validateEleicaoForm(next, nextEvento));
      }

      return next;
    });
  }

  function touchEleicaoField(field: keyof EleicaoForm) {
    if (!form) return;

    setFormTouched((current) => ({ ...current, [field]: true }));
    setFormErrors(validateEleicaoForm(form, selectedEvento));
  }

  async function handleSaveEleicao() {
    if (!form || savingEleicao) return;

    const errors = validateEleicaoForm(form, selectedEvento);
    setFormErrors(errors);
    setFormTouched({
      eventoId: true,
      dataInicial: true,
      dataFinal: true,
      dataInicioVotacao: true,
      dataInicioApuracao: true,
      dataCadastro: true,
    });

    if (hasErrors(errors)) {
      await alerts.warn({ text: "Revise as informações antes de salvar." });
      return;
    }

    try {
      setSavingEleicao(true);
      alerts.loading({ title: "Salvando alterações..." });

      await atualizarEleicao(eleicaoId, toEleicaoPayload(form));

      alerts.close();
      setInitialForm(form);
      const refreshed = await buscarEleicaoPorId(eleicaoId);
      const refreshedForm = formFromEleicao(refreshed);
      setEleicao(refreshed);
      setForm(refreshedForm);
      setInitialForm(refreshedForm);
      await alerts.success({ text: "Eleição atualizada com sucesso." });
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSavingEleicao(false);
    }
  }

  function clearOfficialFilters() {
    setFilterNomeUsuario("");
    setDebouncedFilterNomeUsuario("");
    setFilterCargoId(allFunctionsValue);
    setOficiaisPage(0);
  }

  function clearCandidateFilters() {
    setFilterNomeCandidato("");
    setDebouncedFilterNomeCandidato("");
    setFilterCargoCandidatoId(allCandidateCargosValue);
    setFilterNumeroCandidato("");
    setDebouncedFilterNumeroCandidato("");
    setCandidatosPage(0);
  }

  function resetOficialDialog() {
    setDialogOpen(false);
    setSelectedOficial(null);
    setOficialForm({});
    setOficialFormErrors({});
    setOficialFormTouched({});
    setMemberSearch("");
    setDebouncedMemberSearch("");
    setMembers([]);
    setSavingOficial(false);
  }

  function openCreateOficialDialog() {
    setSelectedOficial(null);
    setOficialForm({});
    setOficialFormErrors({});
    setOficialFormTouched({});
    setMemberSearch("");
    setDialogOpen(true);
  }

  function openEditOficialDialog(oficial: OficialEleicao) {
    setSelectedOficial(oficial);
    setOficialForm({
      usuarioId: oficial.usuarioId,
      cargoIdAdministrativo: oficial.cargoIdAdministrativo,
    });
    setOficialFormErrors({});
    setOficialFormTouched({});
    setMemberSearch("");
    setDialogOpen(true);
  }

  function updateOficialForm<K extends keyof OficialForm>(
    field: K,
    value: OficialForm[K]
  ) {
    setOficialForm((current) => {
      const next = { ...current, [field]: value };

      if (oficialFormTouched[field]) {
        setOficialFormErrors(validateOficialForm(next));
      }

      return next;
    });
  }

  function touchOficialField(field: keyof OficialForm) {
    setOficialFormTouched((current) => ({ ...current, [field]: true }));
    setOficialFormErrors(validateOficialForm(oficialForm));
  }

  function toOficialPayload(formData: OficialForm): OficialEleicaoPayload {
    return {
      eleicaoId,
      usuarioId: formData.usuarioId!,
      cargoIdAdministrativo: formData.cargoIdAdministrativo!,
    };
  }

  async function handleSaveOficial() {
    if (savingOficial) return;

    const errors = validateOficialForm(oficialForm);
    setOficialFormErrors(errors);
    setOficialFormTouched({
      usuarioId: true,
      cargoIdAdministrativo: true,
    });

    if (hasErrors(errors)) {
      await alerts.warn({ text: "Revise as informações antes de salvar." });
      return;
    }

    try {
      setSavingOficial(true);
      alerts.loading({
        title: selectedOficial ? "Salvando oficial..." : "Adicionando oficial...",
      });

      if (selectedOficial) {
        await atualizarOficialEleicao(
          selectedOficial.oficialEleicaoId,
          toOficialPayload(oficialForm)
        );
      } else {
        await cadastrarOficialEleicao(toOficialPayload(oficialForm));
      }

      alerts.close();
      await alerts.success({
        text: selectedOficial
          ? "Oficial da eleição atualizado com sucesso."
          : "Oficial da eleição cadastrado com sucesso.",
      });

      resetOficialDialog();
      await loadOficiais(oficiaisPage);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSavingOficial(false);
    }
  }

  async function handleDeleteOficial(oficial: OficialEleicao) {
    if (deletingOficialId) return;

    const confirmed = await alerts.confirm({
      title: "Excluir oficial",
      text: `Deseja realmente excluir ${oficial.nomeUsuario} (${getOfficialCargoLabel(
        oficial.nomeCargoAdministrativo
      )}) desta eleição?`,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setDeletingOficialId(oficial.oficialEleicaoId);
      alerts.loading({ title: "Excluindo oficial..." });
      await excluirOficialEleicao(oficial.oficialEleicaoId);
      alerts.close();
      await alerts.success({ text: "Oficial da eleição excluído com sucesso." });

      const currentItems = oficiaisData?.content.length ?? 0;
      const nextPage =
        currentItems === 1 && oficiaisPage > 0 ? oficiaisPage - 1 : oficiaisPage;
      await loadOficiais(nextPage);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setDeletingOficialId(null);
    }
  }

  function resetCandidatoDialog() {
    setCandidatoDialogOpen(false);
    setSelectedCandidato(null);
    setCandidatoForm({
      numero: "",
      foto: null,
      fotoContentType: null,
      removerFoto: false,
    });
    setCandidatoFormErrors({});
    setCandidatoFormTouched({});
    setMemberSearch("");
    setDebouncedMemberSearch("");
    setMembers([]);
    setSavingCandidato(false);
  }

  function openCreateCandidatoDialog() {
    setSelectedCandidato(null);
    setCandidatoForm({
      numero: "",
      foto: null,
      fotoContentType: null,
      removerFoto: false,
    });
    setCandidatoFormErrors({});
    setCandidatoFormTouched({});
    setMemberSearch("");
    setCandidatoDialogOpen(true);
  }

  function openEditCandidatoDialog(candidato: Candidato) {
    setSelectedCandidato(candidato);
    setCandidatoForm({
      usuarioId: candidato.usuarioId,
      cargoIdEletivo: candidato.cargoIdEletivo,
      numero: String(candidato.numero),
      foto: candidato.fotoUrl ?? null,
      fotoContentType: null,
      removerFoto: false,
    });
    setCandidatoFormErrors({});
    setCandidatoFormTouched({});
    setMemberSearch("");
    setCandidatoDialogOpen(true);
  }

  function updateCandidatoForm<K extends keyof CandidatoForm>(
    field: K,
    value: CandidatoForm[K]
  ) {
    setCandidatoForm((current) => {
      const next = { ...current, [field]: value };

      if (candidatoFormTouched[field]) {
        setCandidatoFormErrors(validateCandidatoForm(next));
      }

      return next;
    });
  }

  function touchCandidatoField(field: keyof CandidatoForm) {
    setCandidatoFormTouched((current) => ({ ...current, [field]: true }));
    setCandidatoFormErrors(validateCandidatoForm(candidatoForm));
  }

  function toCandidatoPayload(formData: CandidatoForm): CandidatoPayload {
    const possuiNovaFoto =
      Boolean(formData.foto)
      && Boolean(formData.fotoContentType);

    return {
      eleicaoId,
      usuarioId: formData.usuarioId!,
      cargoIdEletivo: formData.cargoIdEletivo!,
      numero: Number(formData.numero),
      foto: possuiNovaFoto ? formData.foto : null,
      fotoContentType: possuiNovaFoto ? formData.fotoContentType : null,
      removerFoto: formData.removerFoto || undefined,
    };
  }

  async function handleCandidatePhotoChange(file?: File | null) {
    if (!file) return;

    try {
      const photoData = await readCandidatePhotoFile(file);
      setCandidatoForm((current) => ({
        ...current,
        ...photoData,
        removerFoto: false,
      }));
      setCandidatoFormErrors((current) => ({ ...current, foto: undefined }));
    } catch (photoError) {
      const message =
        photoError instanceof Error
          ? photoError.message
          : "Não foi possível carregar a foto.";

      setCandidatoFormTouched((current) => ({ ...current, foto: true }));
      setCandidatoFormErrors((current) => ({ ...current, foto: message }));
      await alerts.warn({ text: message });
    }
  }

  async function handleSaveCandidato() {
    if (savingCandidato) return;

    const errors = validateCandidatoForm(candidatoForm);
    setCandidatoFormErrors(errors);
    setCandidatoFormTouched({
      usuarioId: true,
      cargoIdEletivo: true,
      numero: true,
    });

    if (hasErrors(errors)) {
      await alerts.warn({ text: "Revise as informações antes de salvar." });
      return;
    }

    try {
      setSavingCandidato(true);
      alerts.loading({
        title: selectedCandidato
          ? "Salvando candidato..."
          : "Adicionando candidato...",
      });

      if (selectedCandidato) {
        await atualizarCandidato(
          selectedCandidato.candidatoId,
          toCandidatoPayload(candidatoForm)
        );
      } else {
        await cadastrarCandidato(toCandidatoPayload(candidatoForm));
      }

      alerts.close();
      await alerts.success({
        text: selectedCandidato
          ? "Candidato atualizado com sucesso."
          : "Candidato cadastrado com sucesso.",
      });

      resetCandidatoDialog();
      await loadCandidatos(candidatosPage);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setSavingCandidato(false);
    }
  }

  async function handleDeleteCandidato(candidato: Candidato) {
    if (deletingCandidatoId) return;

    const confirmed = await alerts.confirm({
      title: "Excluir candidato",
      text: `Deseja realmente excluir este candidato da eleição?\n\n${candidato.nomeUsuario}\n${candidato.nomeCargoEletivo}\nNúmero ${candidato.numero}`,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      setDeletingCandidatoId(candidato.candidatoId);
      alerts.loading({ title: "Excluindo candidato..." });
      await excluirCandidato(candidato.candidatoId);
      alerts.close();
      await alerts.success({ text: "Candidato excluído com sucesso." });

      const currentItems = candidatosData?.content.length ?? 0;
      const nextPage =
        currentItems === 1 && candidatosPage > 0
          ? candidatosPage - 1
          : candidatosPage;
      await loadCandidatos(nextPage);
    } catch (requestError) {
      alerts.close();
      await alerts.error({ text: handleAxiosError(requestError) });
    } finally {
      setDeletingCandidatoId(null);
    }
  }

  const currentPeriod = selectedEvento
    ? `${formatarDataToBr(selectedEvento.dataInicial)} a ${formatarDataToBr(
        selectedEvento.dataFinal
      )}`
    : null;

  return (
    <section
      className="portal-page editar-eleicao-page"
      aria-labelledby="editar-eleicao-title"
    >
      <div className="editar-eleicao-backRow">
        <GestaoBackButton
          ariaLabel="Voltar para Gestão de Eleições"
          to="/processo-eleitoral/eleicoes"
        />
      </div>

      <header className="portal-pageHeader editar-eleicao-header">
        <div>
          <h1 id="editar-eleicao-title">Editar Eleição</h1>
          <p>Gerencie os dados, configurações, oficiais e candidatos desta eleição.</p>
        </div>
        {eleicao ? (
          <span className="editar-eleicao-id">Eleição: #{eleicao.eleicaoId}</span>
        ) : null}
      </header>

      {loading ? (
        <div className="portal-state">Carregando eleição...</div>
      ) : error ? (
        <div className="portal-state portal-state--error">{error}</div>
      ) : form ? (
        <>
          <section className="editar-eleicao-card" aria-label="Dados da eleição">
            <header className="editar-eleicao-cardHeader">
              <div>
                <SectionIcon type="data" />
                <div>
                  <strong>Dados da Eleição</strong>
                  <span>Atualize as informações e configurações desta eleição.</span>
                </div>
              </div>
            </header>

            {eventosError ? (
              <div className="portal-state portal-state--error">{eventosError}</div>
            ) : null}

            <div className="editar-eleicao-formGrid">
              <div className="editar-eleicao-eventRow">
                <FormField
                  label="Evento"
                  required
                  error={formTouched.eventoId ? formErrors.eventoId : undefined}
                  helperText={
                    selectedEvento ? (
                      <span className="editar-eleicao-eventMeta">
                        <strong>{selectedEvento.nomeConvencao}</strong>
                        <span>Período do evento: {currentPeriod}</span>
                      </span>
                    ) : null
                  }
                >
                  <DropdownField<number>
                    value={form.eventoId}
                    options={eventoOptions}
                    placeholder={eventosLoading ? "Carregando..." : "Selecione o evento"}
                    searchPlaceholder="Buscar evento..."
                    emptyText={
                      eventosLoading ? "Carregando eventos..." : "Nenhum evento encontrado"
                    }
                    disabled={eventosLoading || savingEleicao}
                    invalid={!!(formTouched.eventoId && formErrors.eventoId)}
                    onChange={(value) => updateEleicaoForm("eventoId", value)}
                    onBlur={() => touchEleicaoField("eventoId")}
                  />
                </FormField>

                <FormField
                  label="Data de cadastro"
                  required
                  error={formTouched.dataCadastro ? formErrors.dataCadastro : undefined}
                >
                  <input
                    className="vf-input editar-eleicao-readonlyInput"
                    type="date"
                    value={form.dataCadastro}
                    readOnly
                    aria-readonly="true"
                    aria-invalid={!!(formTouched.dataCadastro && formErrors.dataCadastro)}
                  />
                </FormField>
              </div>

              <div className="editar-eleicao-dateGrid">
                <FormField
                  label="Data inicial"
                  required
                  error={formTouched.dataInicial ? formErrors.dataInicial : undefined}
                >
                  <input
                    className="vf-input"
                    type="date"
                    value={form.dataInicial}
                    disabled={savingEleicao}
                    aria-invalid={!!(formTouched.dataInicial && formErrors.dataInicial)}
                    onChange={(event) =>
                      updateEleicaoForm("dataInicial", event.target.value)
                    }
                    onBlur={() => touchEleicaoField("dataInicial")}
                  />
                </FormField>

                <FormField
                  label="Data final"
                  required
                  error={formTouched.dataFinal ? formErrors.dataFinal : undefined}
                >
                  <input
                    className="vf-input"
                    type="date"
                    value={form.dataFinal}
                    min={form.dataInicial || undefined}
                    disabled={savingEleicao}
                    aria-invalid={!!(formTouched.dataFinal && formErrors.dataFinal)}
                    onChange={(event) =>
                      updateEleicaoForm("dataFinal", event.target.value)
                    }
                    onBlur={() => touchEleicaoField("dataFinal")}
                  />
                </FormField>

                <FormField
                  label="Início da votação"
                  required
                  error={
                    formTouched.dataInicioVotacao
                      ? formErrors.dataInicioVotacao
                      : undefined
                  }
                >
                  <input
                    className="vf-input"
                    type="datetime-local"
                    value={form.dataInicioVotacao}
                    min={form.dataInicial ? `${form.dataInicial}T00:00` : undefined}
                    max={getVotacaoMax(form)}
                    disabled={savingEleicao}
                    aria-invalid={
                      !!(
                        formTouched.dataInicioVotacao &&
                        formErrors.dataInicioVotacao
                      )
                    }
                    onChange={(event) =>
                      updateEleicaoForm("dataInicioVotacao", event.target.value)
                    }
                    onBlur={() => touchEleicaoField("dataInicioVotacao")}
                  />
                </FormField>

                <FormField
                  label="Início da apuração"
                  required
                  error={
                    formTouched.dataInicioApuracao
                      ? formErrors.dataInicioApuracao
                      : undefined
                  }
                >
                  <input
                    className="vf-input"
                    type="datetime-local"
                    value={form.dataInicioApuracao}
                    min={form.dataInicial ? `${form.dataInicial}T00:00` : undefined}
                    max={form.dataFinal ? `${form.dataFinal}T23:59` : undefined}
                    disabled={savingEleicao}
                    aria-invalid={
                      !!(
                        formTouched.dataInicioApuracao &&
                        formErrors.dataInicioApuracao
                      )
                    }
                    onChange={(event) =>
                      updateEleicaoForm("dataInicioApuracao", event.target.value)
                    }
                    onBlur={() => touchEleicaoField("dataInicioApuracao")}
                  />
                </FormField>

              </div>

            </div>

            <footer className="editar-eleicao-sectionFooter">
              <button
                className="editar-eleicao-primaryButton"
                type="button"
                disabled={savingEleicao || !initialForm}
                onClick={() => void handleSaveEleicao()}
              >
                {savingEleicao ? "Salvando..." : "Salvar alterações"}
              </button>
            </footer>
          </section>

          <section
            className="editar-eleicao-card"
            aria-label="Oficiais da eleição"
          >
            <header className="editar-eleicao-cardHeader">
              <div>
                <SectionIcon type="officers" />
                <div>
                  <strong>Oficiais da Eleição</strong>
                  <span>Gerencie os mesários e fiscais responsáveis por esta eleição.</span>
                </div>
              </div>
              <button
                className="editar-eleicao-primaryButton"
                type="button"
                disabled={cargosLoading || Boolean(cargosError)}
                onClick={openCreateOficialDialog}
              >
                + Adicionar oficial
              </button>
            </header>

            {cargosError ? (
              <div className="portal-state portal-state--error">{cargosError}</div>
            ) : null}

            <section className="editar-eleicao-officialFilters">
              <FormField label="Oficial">
                <input
                  className="vf-input"
                  value={filterNomeUsuario}
                  placeholder="Buscar oficial por nome..."
                  onChange={(event) => setFilterNomeUsuario(event.target.value)}
                />
              </FormField>

              <FormField label="Função">
                <DropdownField<number>
                  value={filterCargoId}
                  options={cargoFilterOptions}
                  placeholder={cargosLoading ? "Carregando..." : "Todas as funções"}
                  searchPlaceholder="Buscar função..."
                  emptyText={
                    cargosLoading ? "Carregando funções..." : "Nenhuma função encontrada"
                  }
                  disabled={cargosLoading}
                  onChange={(value) => {
                    setFilterCargoId(value);
                    setOficiaisPage(0);
                  }}
                />
              </FormField>

              <div className="gestao-filterActions">
                <ClearFiltersButton
                  disabled={!hasOfficialFilters}
                  onClick={clearOfficialFilters}
                />
              </div>
            </section>

            <section className="identity-tableCard editar-eleicao-officialTableCard">
              {oficiaisLoading ? (
                <div className="portal-state">Carregando oficiais...</div>
              ) : oficiaisError ? (
                <div className="portal-state portal-state--error">{oficiaisError}</div>
              ) : oficiais.length === 0 ? (
                <div className="identity-empty">
                  <strong>
                    {hasOfficialFilters
                      ? "Nenhum oficial encontrado para os filtros informados."
                      : "Nenhum oficial cadastrado para esta eleição."}
                  </strong>
                </div>
              ) : (
                <div className="identity-tableWrap">
                  <table className="identity-table editar-eleicao-officialTable">
                    <thead>
                      <tr>
                        <th>Oficial</th>
                        <th>Função</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oficiais.map((oficial) => (
                        <tr key={oficial.oficialEleicaoId}>
                          <td>
                            <span className="editar-eleicao-officialName">
                              {oficial.nomeUsuario}
                            </span>
                          </td>
                          <td>
                            <span className="portal-badge portal-badge--ativo">
                              {getOfficialCargoLabel(oficial.nomeCargoAdministrativo)}
                            </span>
                          </td>
                          <td>
                            <div className="editar-eleicao-actions">
                              <button
                                type="button"
                                title="Editar oficial"
                                aria-label={`Editar oficial ${oficial.nomeUsuario}`}
                                onClick={() => openEditOficialDialog(oficial)}
                              >
                                <EditIcon />
                              </button>
                              <button
                                className="editar-eleicao-actionDelete"
                                type="button"
                                title="Excluir oficial"
                                aria-label={`Excluir oficial ${oficial.nomeUsuario}`}
                                disabled={
                                  deletingOficialId === oficial.oficialEleicaoId
                                }
                                onClick={() => void handleDeleteOficial(oficial)}
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <footer className="identity-pagination">
                <span>
                  Página {oficiaisPage + 1} de {Math.max(oficiaisTotalPages, 1)}
                </span>
                <div>
                  <button
                    type="button"
                    disabled={oficiaisPage === 0}
                    onClick={() => setOficiaisPage((current) => current - 1)}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={
                      oficiaisTotalPages === 0 ||
                      oficiaisPage + 1 >= oficiaisTotalPages
                    }
                    onClick={() => setOficiaisPage((current) => current + 1)}
                  >
                    Próxima
                  </button>
                </div>
              </footer>
            </section>
          </section>

          <section
            className="editar-eleicao-card"
            aria-label="Candidatos da eleição"
          >
            <header className="editar-eleicao-cardHeader">
              <div>
                <SectionIcon type="candidates" />
                <div>
                  <strong>Candidatos</strong>
                  <span>Gerencie os candidatos participantes desta eleição.</span>
                </div>
              </div>
              <button
                className="editar-eleicao-primaryButton"
                type="button"
                disabled={cargosLoading || Boolean(cargosError)}
                onClick={openCreateCandidatoDialog}
              >
                + Adicionar candidato
              </button>
            </header>

            {cargosError ? (
              <div className="portal-state portal-state--error">{cargosError}</div>
            ) : null}

            <section className="editar-eleicao-candidateFilters">
              <FormField label="Candidato">
                <input
                  className="vf-input"
                  value={filterNomeCandidato}
                  placeholder="Buscar candidato por nome..."
                  onChange={(event) => setFilterNomeCandidato(event.target.value)}
                />
              </FormField>

              <FormField label="Cargo eletivo">
                <DropdownField<number>
                  value={filterCargoCandidatoId}
                  options={cargoCandidatoFilterOptions}
                  placeholder={cargosLoading ? "Carregando..." : "Todos os cargos"}
                  searchPlaceholder="Buscar cargo..."
                  emptyText={
                    cargosLoading ? "Carregando cargos..." : "Nenhum cargo encontrado"
                  }
                  disabled={cargosLoading}
                  onChange={(value) => {
                    setFilterCargoCandidatoId(value);
                    setCandidatosPage(0);
                  }}
                />
              </FormField>

              <FormField label="Número">
                <input
                  className="vf-input"
                  type="number"
                  min={1}
                  value={filterNumeroCandidato}
                  placeholder="Número..."
                  onChange={(event) =>
                    setFilterNumeroCandidato(onlyDigits(event.target.value))
                  }
                />
              </FormField>

              <div className="gestao-filterActions">
                <ClearFiltersButton
                  disabled={!hasCandidateFilters}
                  onClick={clearCandidateFilters}
                />
              </div>
            </section>

            <section className="identity-tableCard editar-eleicao-officialTableCard">
              {candidatosLoading ? (
                <div className="portal-state">Carregando candidatos...</div>
              ) : candidatosError ? (
                <div className="portal-state portal-state--error">{candidatosError}</div>
              ) : candidatos.length === 0 ? (
                <div className="identity-empty">
                  <strong>
                    {hasCandidateFilters
                      ? "Nenhum candidato encontrado para os filtros informados."
                      : "Nenhum candidato cadastrado para esta eleição."}
                  </strong>
                </div>
              ) : (
                <div className="identity-tableWrap">
                  <table className="identity-table editar-eleicao-candidateTable">
                    <thead>
                      <tr>
                        <th>Candidato</th>
                        <th>Cargo eletivo</th>
                        <th>Número</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidatos.map((candidato) => (
                        <tr key={candidato.candidatoId}>
                          <td>
                            <div className="editar-eleicao-personCell">
                              <MemberAvatar
                                src={getCandidatePhotoSrc(candidato)}
                                alt={candidato.nomeUsuario}
                                fallback={candidato.nomeUsuario}
                                size="sm"
                              />
                              <span className="editar-eleicao-personText">
                                <strong>{candidato.nomeUsuario}</strong>
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="portal-badge portal-badge--ativo">
                              {candidato.nomeCargoEletivo}
                            </span>
                          </td>
                          <td>
                            <span className="editar-eleicao-numberBadge">
                              {candidato.numero}
                            </span>
                          </td>
                          <td>
                            <div className="editar-eleicao-actions">
                              <button
                                type="button"
                                title="Editar candidato"
                                aria-label={`Editar candidato ${candidato.nomeUsuario}`}
                                onClick={() => openEditCandidatoDialog(candidato)}
                              >
                                <EditIcon />
                              </button>
                              <button
                                className="editar-eleicao-actionDelete"
                                type="button"
                                title="Excluir candidato"
                                aria-label={`Excluir candidato ${candidato.nomeUsuario}`}
                                disabled={
                                  deletingCandidatoId === candidato.candidatoId
                                }
                                onClick={() => void handleDeleteCandidato(candidato)}
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <footer className="identity-pagination">
                <span>
                  Página {candidatosPage + 1} de{" "}
                  {Math.max(candidatosTotalPages, 1)} (
                  {candidatosData?.totalElements ?? 0} candidatos cadastrados)
                </span>
                <div>
                  <button
                    type="button"
                    disabled={candidatosPage === 0}
                    onClick={() => setCandidatosPage((current) => current - 1)}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={
                      candidatosTotalPages === 0 ||
                      candidatosPage + 1 >= candidatosTotalPages
                    }
                    onClick={() => setCandidatosPage((current) => current + 1)}
                  >
                    Próxima
                  </button>
                </div>
              </footer>
            </section>
          </section>
        </>
      ) : null}

      {dialogOpen ? (
        <div
          className="editar-eleicao-dialogLayer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="oficial-dialog-title"
        >
          <button
            className="editar-eleicao-dialogBackdrop"
            type="button"
            aria-label="Fechar"
            onClick={resetOficialDialog}
          />
          <section className="editar-eleicao-dialog">
            <header className="editar-eleicao-dialogHeader">
              <div>
                <h2 id="oficial-dialog-title">{dialogTitle}</h2>
                <p>{dialogSubtitle}</p>
              </div>
              <button type="button" aria-label="Fechar" onClick={resetOficialDialog}>
                ×
              </button>
            </header>

            <div className="editar-eleicao-dialogForm">
              <FormField
                label="Oficial"
                required
                error={
                  oficialFormTouched.usuarioId
                    ? oficialFormErrors.usuarioId
                    : undefined
                }
                helperText="Busque pelo nome ou CPF do membro cadastrado."
              >
                <DropdownField<number>
                  value={oficialForm.usuarioId}
                  options={memberOptions}
                  placeholder={membersLoading ? "Carregando..." : "Selecione um membro"}
                  searchPlaceholder="Buscar membro..."
                  emptyText={
                    membersLoading ? "Carregando membros..." : "Nenhum membro encontrado"
                  }
                  disabled={membersLoading || savingOficial}
                  invalid={
                    !!(
                      oficialFormTouched.usuarioId &&
                      oficialFormErrors.usuarioId
                    )
                  }
                  onSearchChange={setMemberSearch}
                  onChange={(value) => updateOficialForm("usuarioId", value)}
                  onBlur={() => touchOficialField("usuarioId")}
                />
              </FormField>

              <FormField
                label="Função"
                required
                error={
                  oficialFormTouched.cargoIdAdministrativo
                    ? oficialFormErrors.cargoIdAdministrativo
                    : undefined
                }
              >
                <DropdownField<number>
                  value={oficialForm.cargoIdAdministrativo}
                  options={cargoOptions}
                  placeholder={cargosLoading ? "Carregando..." : "Selecione a função"}
                  searchPlaceholder="Buscar função..."
                  emptyText={
                    cargosLoading ? "Carregando funções..." : "Nenhuma função encontrada"
                  }
                  disabled={cargosLoading || savingOficial}
                  invalid={
                    !!(
                      oficialFormTouched.cargoIdAdministrativo &&
                      oficialFormErrors.cargoIdAdministrativo
                    )
                  }
                  onChange={(value) =>
                    updateOficialForm("cargoIdAdministrativo", value)
                  }
                  onBlur={() => touchOficialField("cargoIdAdministrativo")}
                />
              </FormField>

              <div className="editar-eleicao-infoBox">
                Um membro só pode desempenhar uma função oficial dentro da mesma eleição.
              </div>
            </div>

            <footer>
              <button type="button" onClick={resetOficialDialog} disabled={savingOficial}>
                Cancelar
              </button>
              <button
                className="editar-eleicao-primaryButton"
                type="button"
                disabled={savingOficial}
                onClick={() => void handleSaveOficial()}
              >
                {savingOficial
                  ? "Salvando..."
                  : selectedOficial
                    ? "Salvar alterações"
                    : "Salvar oficial"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {candidatoDialogOpen ? (
        <div
          className="editar-eleicao-dialogLayer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="candidato-dialog-title"
        >
          <button
            className="editar-eleicao-dialogBackdrop"
            type="button"
            aria-label="Fechar"
            onClick={resetCandidatoDialog}
          />
          <section className="editar-eleicao-dialog editar-eleicao-candidateDialog">
            <header className="editar-eleicao-dialogHeader">
              <div>
                <h2 id="candidato-dialog-title">{candidatoDialogTitle}</h2>
                <p>{candidatoDialogSubtitle}</p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={resetCandidatoDialog}
              >
                ×
              </button>
            </header>

            <div className="editar-eleicao-dialogForm">
              <FormField
                label="Candidato"
                required
                error={
                  candidatoFormTouched.usuarioId
                    ? candidatoFormErrors.usuarioId
                    : undefined
                }
                helperText="Busque pelo nome ou CPF do membro cadastrado."
              >
                <DropdownField<number>
                  value={candidatoForm.usuarioId}
                  options={memberOptions}
                  placeholder={membersLoading ? "Carregando..." : "Selecione um membro"}
                  searchPlaceholder="Buscar membro..."
                  emptyText={
                    membersLoading ? "Carregando membros..." : "Nenhum membro encontrado"
                  }
                  disabled={membersLoading || savingCandidato}
                  invalid={
                    !!(
                      candidatoFormTouched.usuarioId &&
                      candidatoFormErrors.usuarioId
                    )
                  }
                  onSearchChange={setMemberSearch}
                  onChange={(value) => updateCandidatoForm("usuarioId", value)}
                  onBlur={() => touchCandidatoField("usuarioId")}
                />
              </FormField>

              <div className="editar-eleicao-candidateDialogGrid">
                <FormField
                  label="Cargo eletivo"
                  required
                  error={
                    candidatoFormTouched.cargoIdEletivo
                      ? candidatoFormErrors.cargoIdEletivo
                      : undefined
                  }
                >
                  <DropdownField<number>
                    value={candidatoForm.cargoIdEletivo}
                    options={cargoCandidatoOptions}
                    placeholder={cargosLoading ? "Carregando..." : "Selecione um cargo"}
                    searchPlaceholder="Buscar cargo..."
                    emptyText={
                      cargosLoading
                        ? "Carregando cargos..."
                        : "Nenhum cargo eletivo disponível"
                    }
                    disabled={cargosLoading || savingCandidato}
                    invalid={
                      !!(
                        candidatoFormTouched.cargoIdEletivo &&
                        candidatoFormErrors.cargoIdEletivo
                      )
                    }
                    onChange={(value) => updateCandidatoForm("cargoIdEletivo", value)}
                    onBlur={() => touchCandidatoField("cargoIdEletivo")}
                  />
                </FormField>

                <FormField
                  label="Número"
                  required
                  error={
                    candidatoFormTouched.numero
                      ? candidatoFormErrors.numero
                      : undefined
                  }
                >
                  <input
                    className="vf-input"
                    type="number"
                    min={1}
                    value={candidatoForm.numero}
                    placeholder="Ex.: 12"
                    disabled={savingCandidato}
                    aria-invalid={
                      !!(candidatoFormTouched.numero && candidatoFormErrors.numero)
                    }
                    onChange={(event) =>
                      updateCandidatoForm("numero", onlyDigits(event.target.value))
                    }
                    onBlur={() => touchCandidatoField("numero")}
                  />
                </FormField>
              </div>

              <FormField
                label="Foto"
                error={
                  candidatoFormTouched.foto ? candidatoFormErrors.foto : undefined
                }
                helperText="A foto é opcional."
              >
                <label
                  className="editar-eleicao-photoUpload"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (savingCandidato) return;
                    void handleCandidatePhotoChange(event.dataTransfer.files?.[0]);
                  }}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={savingCandidato}
                    onChange={(event) => {
                      void handleCandidatePhotoChange(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />

                  {candidatoPhotoPreview ? (
                    <span className="editar-eleicao-photoPreview">
                      <MemberAvatar
                        src={candidatoPhotoPreview}
                        alt="Foto do candidato"
                        fallback={selectedCandidato?.nomeUsuario}
                        size={52}
                      />
                      <span>
                        <strong>Foto selecionada</strong>
                        <small>JPG ou PNG anexado ao candidato.</small>
                      </span>
                    </span>
                  ) : (
                    <span className="editar-eleicao-photoPlaceholder">
                      <span className="editar-eleicao-photoIcon" aria-hidden>
                        +
                      </span>
                      <span>
                        <strong>Clique ou arraste uma foto do candidato</strong>
                        <small>JPG ou PNG.</small>
                      </span>
                    </span>
                  )}
                </label>

                {candidatoPhotoPreview ? (
                  <div className="editar-eleicao-photoActions">
                    <label>
                      Alterar
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        disabled={savingCandidato}
                        onChange={(event) => {
                          void handleCandidatePhotoChange(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={savingCandidato}
                      onClick={() => {
                        setCandidatoForm((current) => ({
                          ...current,
                          foto: null,
                          fotoContentType: null,
                          removerFoto: true,
                        }));
                        setCandidatoFormErrors((current) => ({
                          ...current,
                          foto: undefined,
                        }));
                      }}
                    >
                      Remover
                    </button>
                  </div>
                ) : null}
              </FormField>

              <div className="editar-eleicao-infoBox">
                O candidato só será vinculado a esta eleição após salvar. A
                unicidade do candidato e do número é validada no backend.
              </div>
            </div>

            <footer>
              <button
                type="button"
                onClick={resetCandidatoDialog}
                disabled={savingCandidato}
              >
                Cancelar
              </button>
              <button
                className="editar-eleicao-primaryButton"
                type="button"
                disabled={savingCandidato}
                onClick={() => void handleSaveCandidato()}
              >
                {savingCandidato
                  ? "Salvando..."
                  : selectedCandidato
                    ? "Salvar alterações"
                    : "Salvar candidato"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
