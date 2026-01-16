// src/features/twoFactor/useTwoFactorConfirm.ts
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { alerts } from "../../lib/swal";
import { handleAxiosError } from "../../utils/messageErro";
import { validarTwoFactor } from "../../services/usuario";
import { useTwoFactor } from "../../context/TwoFactorContext";
import { usePessoa } from "../../context/PessoaContext";

const onlyDigits = (s: string) => s.replace(/\D/g, "").slice(0, 6);

export function useTwoFactorConfirm() {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  const { secret, clearSecret } = useTwoFactor();
  const { email, clearPessoa } = usePessoa();

  const error = useMemo(() => {
    if (!touched) return undefined;
    if (!code) return "Informe o código.";
    if (code.length !== 6) return "O código deve ter 6 dígitos.";
    return undefined;
  }, [code, touched]);

  const canSubmit = useMemo(() => {
    return !!secret && !!email && code.length === 6 && !isSubmitting;
  }, [secret, email, code, isSubmitting]);

  function onChangeCode(v: string) {
    setCode(onlyDigits(v));
  }

  function onBlurCode() {
    setTouched(true);
  }

  /**
   * Retorna:
   * - true  => confirmou com sucesso
   * - false => falhou/invalidou
   */
  async function confirm(): Promise<boolean> {
    setTouched(true);

    if (!secret) {
      alerts.warn({ text: "Secret não encontrado. Gere o QR Code novamente." });
      return false;
    }

    if (!email) {
      alerts.warn({ text: "E-mail não encontrado. Faça login novamente." });
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
      const ok = await validarTwoFactor({ email, secret, code }, controller.signal);

      if (!ok) {
        // ❗Inválido: limpa tudo e volta pro login
        clearSecret();
        clearPessoa();
        alerts.error({ text: "Código inválido. Faça login novamente." });
        navigate("/login");
        return false;
      }

      // ✅ Sucesso: limpa tudo e volta pro login (como você pediu)
      clearSecret();
      clearPessoa();
      alerts.success({ text: "Two-factor confirmado com sucesso!" });
      navigate("/login");
      return true;
    } catch (err) {
      // ❗Erro: limpa tudo e volta pro login
      clearSecret();
      clearPessoa();
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
