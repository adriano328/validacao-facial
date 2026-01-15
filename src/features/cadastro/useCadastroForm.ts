import { useMemo, useRef, useState, useEffect } from "react";
import { initialCadastroForm, type Pessoa } from "./types";
import {
  validateCadastro,
  validateField,
  hasErrors,
  type CadastroErrors,
} from "./validator";
import { salvarPessoa } from "../../services/pessoa";
import { brDateToISO } from "../../utils/formataData";
import { useNavigate } from "react-router-dom";
import { handleAxiosError } from "../../utils/messageErro";
import { alerts } from "../../lib/swal";
import { usePessoa } from "../../context/PessoaContext";

type TouchedState = Partial<Record<keyof Pessoa, boolean>>;

export function useCadastroForm() {
  const [formCadastro, setForm] = useState<Pessoa>(initialCadastroForm);
  const [errors, setErrors] = useState<CadastroErrors>({});
  const [touched, setTouched] = useState<TouchedState>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { setPessoaId } = usePessoa();

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const setFormCadastro = <K extends keyof Pessoa>(key: K, value: Pessoa[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (submitAttempted || touched[key]) {
        setErrors((prevErr) => {
          const nextErr = { ...prevErr };

          const msg = validateField(next, key);
          if (msg) nextErr[key] = msg;
          else delete nextErr[key];

          if (key === "senha" || key === "senhaConfirmacao") {
            const msgConfirm = validateField(next, "senhaConfirmacao");
            if (msgConfirm) nextErr.senhaConfirmacao = msgConfirm;
            else delete nextErr.senhaConfirmacao;
          }

          return nextErr;
        });
      }

      return next;
    });
  };

  const touchField = <K extends keyof Pessoa>(key: K, nextValue?: Pessoa[K]) => {
    setTouched((prev) => ({ ...prev, [key]: true }));

    const snapshot =
      nextValue !== undefined
        ? ({ ...formCadastro, [key]: nextValue } as Pessoa)
        : formCadastro;

    setErrors((prevErr) => {
      const nextErr = { ...prevErr };

      const msg = validateField(snapshot, key);
      if (msg) nextErr[key] = msg;
      else delete nextErr[key];

      if (key === "senha" || key === "senhaConfirmacao") {
        const msgConfirm = validateField(snapshot, "senhaConfirmacao");
        if (msgConfirm) nextErr.senhaConfirmacao = msgConfirm;
        else delete nextErr.senhaConfirmacao;
      }

      return nextErr;
    });
  };

  const validate = () => {
    const nextErrors = validateCadastro(formCadastro);
    setErrors(nextErrors);
    return { ok: !hasErrors(nextErrors), errors: nextErrors };
  };

  const markAllTouched = () => {
    setTouched((prev) => ({
      ...prev,
      nome: true,
      dataNascimento: true,
      telefone: true,
      endereco: true,
      bairro: true,
      numero: true,
      municipioResidencia: true,
      municipioCongregacao: true,
      setorCongregacao: true,
      atividadeProfissional: true,
      email: true,
      senha: true,
      senhaConfirmacao: true,
    }));
  };

  async function handleCadastrar() {
    setSubmitAttempted(true);
    markAllTouched();

    const result = validate();
    if (!result.ok) {
      alerts.warn({ text: "Ops! Revise os campos obrigatórios." });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const payload: Pessoa = {
      ...formCadastro,
      dataNascimento: brDateToISO(formCadastro.dataNascimento) ?? "",
    };

    setIsSubmitting(true);
    try {
      const pessoaId = await salvarPessoa(payload, controller.signal);
      setPessoaId(pessoaId);
      navigate("/liveness");
    } catch (err) {
      const message = handleAxiosError(err);
      alerts.error({ text: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = useMemo(() => {
    return (
      !!formCadastro.nome &&
      !!formCadastro.email &&
      !!formCadastro.senha &&
      !!formCadastro.senhaConfirmacao &&
      !isSubmitting
    );
  }, [
    formCadastro.nome,
    formCadastro.email,
    formCadastro.senha,
    formCadastro.senhaConfirmacao,
    isSubmitting,
  ]);

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;

    setForm(initialCadastroForm);
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setIsSubmitting(false);
  };

  const showError = <K extends keyof Pessoa>(key: K) =>
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
  };
}
