// src/features/twoFactor/useTwoFactorConfirm.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { alerts } from "../../lib/swal";
import { handleAxiosError } from "../../utils/messageErro";
import { validarTwoFactor, verificarTwoFactor } from "../../services/usuario";
import { useTwoFactor } from "../../context/TwoFactorContext";
import { usePessoa } from "../../context/PessoaContext";

const onlyDigits = (s: string) => s.replace(/\D/g, "").slice(0, 6);

export function useTwoFactorConfirm() {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  const { status, secret, clearSecret, setActive, resetTwoFactor } = useTwoFactor();
  const { email, clearPessoa } = usePessoa();

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const error = useMemo(() => {
    if (!touched) return undefined;
    if (!code) return "Informe o código.";
    if (code.length !== 6) return "O código deve ter 6 dígitos.";
    return undefined;
  }, [code, touched]);

  const canSubmit = useMemo(() => {
    if (status === "inactive") return !!secret && !!email && code.length === 6 && !isSubmitting;
    return !!email && code.length === 6 && !isSubmitting;
  }, [status, secret, email, code, isSubmitting]);

  function onChangeCode(v: string) {
    setCode(onlyDigits(v));
  }

  function onBlurCode() {
    setTouched(true);
  }

  function resetLocalInput() {
    setCode("");
    setTouched(false);
  }

  function clearAll() {
    resetLocalInput();
    clearSecret();
    resetTwoFactor();
    // clearPessoa();
  }

  async function confirm(): Promise<boolean> {    
    setTouched(true);
    if (!email) {
      alerts.warn({ text: "E-mail não encontrado. Faça login novamente." });
      return false;
    }

    if (status === "inactive" && !secret) {
      alerts.warn({ text: "Secret não encontrado. Gere o QR Code novamente." });
      return false;
    }

    if (code.length !== 6) {
      alerts.warn({ text: "Informe um código válido de 6 dígitos." });
      return false;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSubmitting(true);
    try {
      let ok = false;
      if (status === "active") {
        ok = await verificarTwoFactor({ email, code }, controller.signal);

        if (!ok) {
          clearAll();
          alerts.error({ text: "Código inválido. Faça login novamente." });
          return false;
        }

        clearAll();
        navigate("/valid");
        return true;
      } else {

      }

      // ✅ inativo: confirmar/ativar (payload com secret)
      ok = await validarTwoFactor({ email, secret: secret!, code }, controller.signal);

      if (!ok) {
        clearAll();
        alerts.error({ text: "Código inválido. Faça login novamente." });
        return false;
      }

      // ✅ ativou com sucesso
      setActive(); // define status active e já limpa secret no context
      resetLocalInput();
      // clearPessoa();

      alerts.success({ text: "Two-factor ativado com sucesso! Faça login novamente." });
      navigate("/login");
      return true;
    } catch (err) {
      clearAll();
      alerts.error({ text: handleAxiosError(err) });
      navigate("/login");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    code,
    onChangeCode,
    onBlurCode,
    error,
    canSubmit,
    isSubmitting,
    confirm,
  };
}
