import { useMemo, useRef, useState, useEffect } from "react";
import {
  initialCadastroForm,
  type CadastroForm,
  type PessoaPayload,
} from "./types";
import {
  validateCadastro,
  validateField,
  hasErrors,
  type CadastroErrors,
} from "./validator";
import { useNavigate } from "react-router-dom";
import { alerts } from "../../lib/swal";
import { brDateToISO } from "../../utils/formataData";
import { stripDataUrl } from "../../utils/formataBase64";
import { salvarPessoa } from "../../services/pessoa";
import { handleAxiosError } from "../../utils/messageErro";
import axios from "axios";

type TouchedState = Partial<Record<keyof CadastroForm, boolean>>;

export function useCadastroForm() {
  const [formCadastro, setForm] = useState<CadastroForm>(initialCadastroForm);
  const [errors, setErrors] = useState<CadastroErrors>({});
  const [touched, setTouched] = useState<TouchedState>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"cadastro" | "confirmarSenha">("cadastro");

  const navigate = useNavigate();

  const abortRef = useRef<AbortController | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      submittingRef.current = false;
    };
  }, []);

  const setFormCadastro = <K extends keyof CadastroForm>(
    key: K,
    value: CadastroForm[K]
  ) => {
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

  const touchField = <K extends keyof CadastroForm>(
    key: K,
    nextValue?: CadastroForm[K]
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
      documento: true,
    });
  };

  async function handleCadastrar() {
    if (submittingRef.current) return;
    submittingRef.current = true;

    setSubmitAttempted(true);
    markAllTouched();

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
        id: 1,
      },
      documento: stripDataUrl(formCadastro.documento),
    };

    setIsSubmitting(true);

    try {
      const pessoaId = await salvarPessoa(payload, controller.signal);
      navigate("/confirmacao");
    } catch (err) {
      if (controller.signal.aborted || axios.isCancel(err)) {
        return;
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
    return (
      !!formCadastro.nome &&
      !!formCadastro.cpf &&
      !!formCadastro.telefone &&
      !!formCadastro.dataNascimento &&
      !!formCadastro.email &&
      !!formCadastro.senha &&
      !!formCadastro.senhaConfirmacao &&
      !!formCadastro.documento &&
      formCadastro.cargo !== undefined &&
      !isSubmitting
    );
  }, [
    formCadastro.nome,
    formCadastro.cpf,
    formCadastro.telefone,
    formCadastro.dataNascimento,
    formCadastro.email,
    formCadastro.senha,
    formCadastro.senhaConfirmacao,
    formCadastro.documento,
    formCadastro.cargo,
    isSubmitting,
  ]);

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    submittingRef.current = false;
    setForm(initialCadastroForm);
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setIsSubmitting(false);
    setStep("cadastro");
  };

  const showError = <K extends keyof CadastroForm>(key: K) =>
    submitAttempted || touched[key] ? errors[key] : undefined;

  return {
    formCadastro,
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