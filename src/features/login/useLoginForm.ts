// src/features/login/useLoginForm.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { alerts } from "../../lib/swal";
import { handleAxiosError } from "../../utils/messageErro";

import { hasErrors, validateField, validateLogin, type LoginErrors } from "./validator";
import { ativarTwoFactor, twoFactorAtivado } from "../../services/usuario";
import { initialLoginForm, type LoginForm } from "./type";
import { usePessoa } from "../../context/PessoaContext";
import { useTwoFactor } from "../../context/TwoFactorContext";

type TouchedState = Partial<Record<keyof LoginForm, boolean>>;
type TwoFactorData = { secret: string; qrCodeUrl: string };
type TwoFactorStep = "none" | "qr" | "confirm";

export function useLoginForm() {
  const [form, setForm] = useState<LoginForm>(initialLoginForm);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<TouchedState>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [qrCodeData, setQrCodeData] = useState<TwoFactorData | null>(null);
  const [twoFactorStep, setTwoFactorStep] = useState<TwoFactorStep>("none");

  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  const { setEmail, setSenha } = usePessoa();
  const { setSecret, clearSecret, setActive, resetTwoFactor } = useTwoFactor();

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);


  const setFormLogin = <K extends keyof LoginForm>(key: K, value: LoginForm[K]) => {
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

  const touchField = <K extends keyof LoginForm>(key: K, nextValue?: LoginForm[K]) => {
    setTouched((prev) => ({ ...prev, [key]: true }));

    const snapshot =
      nextValue !== undefined ? ({ ...form, [key]: nextValue } as LoginForm) : form;

    setErrors((prevErr) => {
      const nextErr = { ...prevErr };
      const msg = validateField(snapshot, key);
      if (msg) nextErr[key] = msg;
      else delete nextErr[key];
      return nextErr;
    });
  };

  const validate = () => {
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    return { ok: !hasErrors(nextErrors), errors: nextErrors };
  };

  const markAllTouched = () => {
    setTouched({ email: true, password: true });
  };

  /* ========================
   * NAV
   * ======================== */

  function irCadastrar() {
    navigate("/cadastro");
  }

  /* ========================
   * 2FA FLOW
   * ======================== */

  function closeTwoFactorFlow() {
    setQrCodeData(null);
    setTwoFactorStep("none");
    clearSecret();
  }

  async function handleLogin() {
    setSubmitAttempted(true);
    markAllTouched();

    const result = validate();
    if (!result.ok) {
      alerts.warn({ text: "Ops! Revise e-mail e senha." });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const email = form.email.trim();
    const senha = form.password.trim();

    setSenha(senha)
    setEmail(email);

    setIsSubmitting(true);
    try {
      const ativado = await twoFactorAtivado(
        { email, password: form.password },
        controller.signal
      );

      if (!ativado) {
        const twoFactor = await ativarTwoFactor(controller.signal);
        setSecret(twoFactor.secret);
        setQrCodeData(twoFactor);
        setTwoFactorStep("qr");

        return;
      }

      setActive();
      setTwoFactorStep("confirm");
    } catch (err) {
      const message = handleAxiosError(err);
      alerts.error({ text: message });
      clearSecret();
    } finally {
      setIsSubmitting(false);
    }
  }

  function goTwoFactorConfirm() {
    setTwoFactorStep("confirm");
  }

  function goTwoFactorQr() {
    setTwoFactorStep("qr");
  }

  const canSubmit = useMemo(() => {
    return !!form.email && !!form.password && !isSubmitting;
  }, [form.email, form.password, isSubmitting]);

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;

    setForm(initialLoginForm);
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setIsSubmitting(false);

    setQrCodeData(null);
    setTwoFactorStep("none");
    resetTwoFactor();
  };

  const showError = <K extends keyof LoginForm>(key: K) =>
    submitAttempted || touched[key] ? errors[key] : undefined;

  return {
    // form
    formLogin: form,
    setFormLogin,
    errors,
    touched,
    submitted: submitAttempted,
    isSubmitting,
    touchField,
    showError,
    validate,
    canSubmit,
    reset,
    handleLogin,
    irCadastrar,
    setTwoFactorStep,
    qrCodeData,
    setQrCodeData,
    twoFactorStep,
    goTwoFactorConfirm,
    goTwoFactorQr,
    closeTwoFactorFlow,
  };
}
