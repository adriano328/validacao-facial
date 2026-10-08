import { useMemo, useRef, useState, useEffect } from "react";
import {
  initialCadastroForm,
  type CadastroForm,
  type CargoUsuario,
  type PessoaPayload,
} from "./types";
import {
  validateCadastro,
  validateField,
  hasErrors,
  type CadastroErrors,
} from "./validator";
import { useNavigate } from "react-router-dom";
import { alerts } from "@shared/lib/swal";
import { brDateToISO, formatarDataToBr } from "@shared/utils/formataData";
import {
  listarCamposEclesiasticos,
  type SelectOptionDto,
} from "@features/admin/api/eventoApi";
import { salvarPessoa } from "@features/registration/api/pessoaApi";
import { handleAxiosError } from "@shared/utils/messageErro";
import { consultaMembro } from "@features/registration/api/consultaMembroApi";
import { isRequestCanceled } from "@shared/utils/http";
import axios from "axios";

type TouchedState = Partial<Record<keyof CadastroForm, boolean>>;

function normalizeCampoId(campoId: number | null | undefined) {
  return typeof campoId === "number" && Number.isFinite(campoId)
    ? campoId
    : undefined;
}

export function useCadastroForm() {
  const [formCadastro, setForm] = useState<CadastroForm>(initialCadastroForm);
  const [errors, setErrors] = useState<CadastroErrors>({});
  const [touched, setTouched] = useState<TouchedState>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"cadastro" | "confirmarSenha">("cadastro");
  const [loadingCpf, setLoadingCpf] = useState(false);
  const [consultaCpfEncontrada, setConsultaCpfEncontrada] = useState(false);
  const [camposEclesiasticos, setCamposEclesiasticos] = useState<
    SelectOptionDto[]
  >([]);
  const [camposEclesiasticosLoading, setCamposEclesiasticosLoading] =
    useState(true);
  const [camposEclesiasticosLoaded, setCamposEclesiasticosLoaded] =
    useState(false);
  const [camposEclesiasticosError, setCamposEclesiasticosError] = useState<
    string | null
  >(null);

  const navigate = useNavigate();

  const abortRef = useRef<AbortController | null>(null);
  const submittingRef = useRef(false);
  const autoCampoEclesiasticoIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      submittingRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCamposEclesiasticos() {
      try {
        setCamposEclesiasticosLoading(true);
        setCamposEclesiasticosLoaded(false);
        setCamposEclesiasticosError(null);

        const campos = await listarCamposEclesiasticos(controller.signal);

        setCamposEclesiasticos(campos);
        setCamposEclesiasticosLoaded(true);
        setForm((current) => {
          const campoSelecionado = current.campoEclesiasticoId;

          if (
            campoSelecionado !== undefined &&
            !campos.some((campo) => campo.id === campoSelecionado)
          ) {
            if (autoCampoEclesiasticoIdRef.current === campoSelecionado) {
              autoCampoEclesiasticoIdRef.current = null;
            }

            return { ...current, campoEclesiasticoId: undefined };
          }

          return current;
        });
      } catch (error) {
        if (isRequestCanceled(error)) return;

        setCamposEclesiasticos([]);
        setCamposEclesiasticosLoaded(false);
        setCamposEclesiasticosError(handleAxiosError(error));
      } finally {
        if (!controller.signal.aborted) {
          setCamposEclesiasticosLoading(false);
        }
      }
    }

    void loadCamposEclesiasticos();

    return () => controller.abort();
  }, []);

  const setFormCadastro = <K extends keyof CadastroForm>(
    key: K,
    value: CadastroForm[K],
  ) => {
    if (key === "cpf") {
      setConsultaCpfEncontrada(false);
    }

    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (submitAttempted || touched[key]) {
        setErrors((prevErr) => {
          const nextErr = { ...prevErr };
          const msg = validateField(next, key);

          if (msg) nextErr[key] = msg;
          else delete nextErr[key];

          return nextErr;
        });
      }

      return next;
    });
  };

  function handleCampoEclesiasticoChange(campoEclesiasticoId: number) {
    autoCampoEclesiasticoIdRef.current = null;
    setFormCadastro("campoEclesiasticoId", campoEclesiasticoId);
  }

  function applyCampoEclesiasticoFromConsulta(
    campoEclesiasticoId: number | null | undefined
  ) {
    const normalizedCampoId = normalizeCampoId(campoEclesiasticoId);

    if (normalizedCampoId === undefined) {
      setForm((current) => {
        if (
          autoCampoEclesiasticoIdRef.current !== null &&
          current.campoEclesiasticoId === autoCampoEclesiasticoIdRef.current
        ) {
          autoCampoEclesiasticoIdRef.current = null;
          return { ...current, campoEclesiasticoId: undefined };
        }

        autoCampoEclesiasticoIdRef.current = null;
        return current;
      });
      return;
    }

    const existsInOptions = camposEclesiasticos.some(
      (campo) => campo.id === normalizedCampoId
    );
    const nextCampoId =
      camposEclesiasticosLoaded && !existsInOptions
        ? undefined
        : normalizedCampoId;

    autoCampoEclesiasticoIdRef.current = nextCampoId ?? null;
    setFormCadastro("campoEclesiasticoId", nextCampoId);
  }

  const touchField = <K extends keyof CadastroForm>(
    key: K,
    nextValue?: CadastroForm[K],
  ) => {
    setTouched((prev) => ({ ...prev, [key]: true }));

    const snapshot =
      nextValue !== undefined
        ? ({ ...formCadastro, [key]: nextValue } as CadastroForm)
        : formCadastro;

    setErrors((prevErr) => {
      const nextErr = { ...prevErr };
      const msg = validateField(snapshot, key);

      if (msg) nextErr[key] = msg;
      else delete nextErr[key];

      return nextErr;
    });
  };

  function handleConfirmarSenha() {
    const senhaError = validateField(formCadastro, "senhaConfirmacao");

    if (senhaError) {
      alerts.warn({ text: senhaError });
      return;
    }

    navigate("/login");
  }

  async function handleConsultaCpf(cpf: string) {
    try {
      const cpfLimpo = cpf.replace(/\D/g, "");
      setConsultaCpfEncontrada(false);

      if (cpfLimpo.length !== 11) {
        return;
      }

      setLoadingCpf(true);

      const response = await consultaMembro({ documento: cpfLimpo });
      if (!response) {
        return;
      }

      setConsultaCpfEncontrada(true);
      setFormCadastro("nome", response.NOME);
      setFormCadastro("dataNascimento", formatarDataToBr(response.NASCIMENTO));
      setFormCadastro("email", response.EMAIL);
      setFormCadastro("cargo", mapearCargo(response.MINISTERIO));
      applyCampoEclesiasticoFromConsulta(response.CAMPO_ID);
    } catch (error: any) {
      setConsultaCpfEncontrada(false);
      console.error(error);
      // opcional: mostrar erro
      // messageAlert.error(error.message)
    } finally {
      setLoadingCpf(false);
    }
  }

  function mapearCargo(ministerio: string): CargoUsuario | undefined {
    const valor = ministerio?.toUpperCase();

    if (valor === "PASTOR") return "PASTOR";
    if (valor === "EVANGELISTA") return "EVANGELISTA";

    return undefined;
  }

  const validate = () => {
    const nextErrors = validateCadastro(formCadastro);
    setErrors(nextErrors);
    return { ok: !hasErrors(nextErrors), errors: nextErrors };
  };

  const markAllTouched = () => {
    setTouched({
      nome: true,
      cargo: true,
      telefone: true,
      dataNascimento: true,
      email: true,
      senha: true,
      senhaConfirmacao: true,
      cpf: true,
      campoEclesiasticoId: true,
      foto: true,
      fotoDocumento: true,
    });
  };

  async function handleCadastrar() {
    if (submittingRef.current) return;
    submittingRef.current = true;

    setSubmitAttempted(true);
    markAllTouched();

    if (!consultaCpfEncontrada) {
      alerts.warn({ text: "Consulte um CPF válido antes de cadastrar." });
      submittingRef.current = false;
      return;
    }

    const result = validate();

    if (!result.ok) {
      alerts.warn({ text: "Ops! Revise os campos obrigatórios." });
      submittingRef.current = false;
      return;
    }

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    const payload: PessoaPayload = {
      nome: formCadastro.nome,
      cargo: formCadastro.cargo!,
      telefone: formCadastro.telefone,
      dataNascimento: brDateToISO(formCadastro.dataNascimento) ?? "",
      email: formCadastro.email,
      senha: formCadastro.senha,
      cpf: formCadastro.cpf.replace(/\D/g, ""),
      campoEclesiastico: {
        id: formCadastro.campoEclesiasticoId!,
      },
      foto: formCadastro.foto,
      fotoDocumento: formCadastro.fotoDocumento,
    };

    setIsSubmitting(true);

    try {
      await salvarPessoa(payload, controller.signal);

      await alerts.success({
        title: "Cadastro realizado com sucesso",
        text: "Recebemos seu cadastro na Plataforma de Voto Eletrônico da COMADEMAT. Para concluir a validação e liberar seu acesso, confirme seu endereço de e-mail pelo link enviado para sua caixa de entrada.",
        timer: 6500,
      });

      navigate("/login", { replace: true });
    } catch (err) {
      if (controller.signal.aborted || axios.isCancel(err)) {
        return;
      }

      if (import.meta.env.DEV && axios.isAxiosError(err)) {
        console.error("Erro no cadastro de usuário", {
          message: err.message,
          code: err.code,
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
          baseURL: err.config?.baseURL,
          hasRequest: Boolean(err.request),
        });
      }

      const message = handleAxiosError(err);
      alerts.error({ text: message });
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }

      setIsSubmitting(false);
      submittingRef.current = false;
    }
  }

  const canSubmit = useMemo(() => {
    return consultaCpfEncontrada && !loadingCpf && !isSubmitting;
  }, [consultaCpfEncontrada, loadingCpf, isSubmitting]);

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    submittingRef.current = false;
    setForm(initialCadastroForm);
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setIsSubmitting(false);
    setConsultaCpfEncontrada(false);
    setStep("cadastro");
  };

  const showError = <K extends keyof CadastroForm>(key: K) =>
    submitAttempted || touched[key] ? errors[key] : undefined;

  return {
    formCadastro,
    camposEclesiasticos,
    camposEclesiasticosLoading,
    camposEclesiasticosError,
    handleCampoEclesiasticoChange,
    handleConsultaCpf,
    loadingCpf,
    setFormCadastro,
    errors,
    touched,
    submitted: submitAttempted,
    isSubmitting,
    touchField,
    showError,
    validate,
    canSubmit,
    reset,
    handleCadastrar,
    handleConfirmarSenha,
    step,
    setStep,
  };
}
