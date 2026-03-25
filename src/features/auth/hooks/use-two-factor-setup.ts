import { useMemo, useState } from "react";
import { validarTwoFactor } from "../api/two-factor";
import { getLivenessErrorMessage } from "../model/liveness.errors";

type UseTwoFactorSetupParams = {
  secret: string;
  email: string;
  senha: string;
  onSuccess: () => void;
};

export function useTwoFactorSetup({
  secret,
  email,
  senha,
  onSuccess,
}: UseTwoFactorSetupParams) {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const codigoFormatado = useMemo(() => {
    return codigo.replace(/\D/g, "").slice(0, 6);
  }, [codigo]);

  async function confirmarCodigo() {
    if (!secret || !email || !senha) {
      setErrorMessage(
        "Dados inválidos para confirmar o 2FA. Faça login novamente."
      );
      return;
    }

    if (codigoFormatado.length !== 6) {
      setErrorMessage("Digite o código de 6 dígitos do autenticador.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const sucesso = await validarTwoFactor({
        secret,
        code: Number(codigoFormatado),
        email,
        senha,
      });

      if (!sucesso) {
        setErrorMessage("Código inválido ou expirado.");
        return;
      }

      onSuccess();
    } catch (error) {
      setErrorMessage(getLivenessErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function copiarSecret() {
    try {
      await navigator.clipboard.writeText(secret);
    } catch {
      setErrorMessage("Não foi possível copiar a chave.");
    }
  }

  return {
    codigo,
    setCodigo,
    codigoFormatado,
    loading,
    errorMessage,
    confirmarCodigo,
    copiarSecret,
  };
}