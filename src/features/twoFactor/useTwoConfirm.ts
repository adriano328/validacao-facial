// src/features/twoFactor/useTwoFactorConfirm.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { alerts } from "../../lib/swal";
import { handleAxiosError } from "../../utils/messageErro";
import { validarTwoFactor, verificarTwoFactor } from "../../services/usuario";
import { useTwoFactor } from "../../context/TwoFactorContext";
import { usePessoa } from "../../context/PessoaContext";

const onlyDigits = (s: string) => s.replace(/\D/g, "").slice(0, 6);

function isAbortError(err: unknown) {
  // fetch abort
  if (err instanceof DOMException && err.name === "AbortError") return true;

  // axios abort/cancel (caso use axios em algum ponto)
  const anyErr = err as any;
  if (anyErr?.code === "ERR_CANCELED") return true;
  if (anyErr?.name === "CanceledError") return true;

  return false;
}

export function useTwoFactorConfirm() {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  const { status, secret, clearSecret, setActive, resetTwoFactor } = useTwoFactor();
  const { email } = usePessoa();

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

    // cancela tentativa anterior e cria uma nova
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSubmitting(true);

    try {
      // ✅ status active: apenas verifica
      if (status === "active") {
        const ok = await verificarTwoFactor({ email, code }, controller.signal);

        if (!ok) {
          // ✅ não navega, só libera para tentar de novo
          setCode("");
          alerts.error({ text: "Código inválido. Tente novamente." });
          return false;
        }

        // ✅ sucesso
        clearAll();
        navigate("/valid");
        return true;
      }

      // ✅ status inactive: valida/ativa com secret
      const ok = await validarTwoFactor(
        { email, secret: secret!, code },
        controller.signal,
      );

      if (!ok) {
        // ✅ não derruba o contexto inteiro; só permite tentar de novo
        setCode("");
        alerts.error({ text: "Código inválido. Tente novamente." });
        return false;
      }

      setActive(); // define status active e limpa secret
      resetLocalInput();

      alerts.success({ text: "Two-factor ativado com sucesso! Faça login novamente." });
      navigate("/login");
      return true;
    } catch (err) {
      // ✅ se foi cancelamento (nova tentativa), não faz nada
      if (isAbortError(err)) return false;

      // ✅ erro real: libera o form para tentar novamente
      setCode("");
      alerts.error({ text: handleAxiosError(err) });
      return false;
    } finally {
      // ✅ SEMPRE destrava
      setIsSubmitting(false);

      // ✅ evita ficar com controller "pendurado"
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
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
