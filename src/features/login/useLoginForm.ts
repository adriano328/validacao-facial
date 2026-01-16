import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { alerts } from "../../lib/swal";
import { handleAxiosError } from "../../utils/messageErro";

import { hasErrors, validateField, validateLogin, type LoginErrors } from "./validator";
import { twoFactorAtivado } from "../../services/usuario";
import { initialLoginForm, type LoginForm } from "./type";

type TouchedState = Partial<Record<keyof LoginForm, boolean>>;

export function useLoginForm() {
  const [form, setForm] = useState<LoginForm>(initialLoginForm);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<TouchedState>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

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
    setTouched((prev) => ({ ...prev, email: true, password: true }));
  };

  function irCadastrar () {
    navigate('/cadastro')
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

    setIsSubmitting(true);
    try {
      const ativado = await twoFactorAtivado(
        { email: form.email.trim(), password: form.password },
        controller.signal
      );

      console.log(ativado);
      
      // if (ativado) navigate("/two-factor");
      // else navigate("/home");
    } catch (err) {
      const message = handleAxiosError(err);
      alerts.error({ text: message });
    } finally {
      setIsSubmitting(false);
    }
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
  };

  const showError = <K extends keyof LoginForm>(key: K) =>
    submitAttempted || touched[key] ? errors[key] : undefined;

  return {
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
    irCadastrar
  };
}
