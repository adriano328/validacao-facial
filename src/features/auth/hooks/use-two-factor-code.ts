import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/login";
import { getLivenessErrorMessage } from "../model/liveness.errors";
import { useAuthToken } from "../../../app/providers/auth-token-provider";

type UseTwoFactorCodeParams = {
  email: string;
  senha: string;
  idSessaoLiveness: string;
};

export function useTwoFactorCode({
  email,
  senha,
  idSessaoLiveness,
}: UseTwoFactorCodeParams) {
  const navigate = useNavigate();
  const { setToken } = useAuthToken();

  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const codigoFormatado = useMemo(() => {
    return codigo.replace(/\D/g, "").slice(0, 6);
  }, [codigo]);

  async function confirmarCodigo() {
    if (!email || !senha || !idSessaoLiveness) {
      setErrorMessage("Dados inválidos para continuar o login.");
      return;
    }

    if (codigoFormatado.length !== 6) {
      setErrorMessage("Digite o código de 6 dígitos do Google Authenticator.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await login({
        email,
        senha,
        idSessaoLiveness,
        twoFactorCode: Number(codigoFormatado),
      });

      if (!response?.token) {
        throw new Error("Token não retornado no login com 2FA.");
      }

      setToken(response.token);
      navigate("/home");
    } catch (error) {
      setErrorMessage(getLivenessErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return {
    codigo,
    setCodigo,
    codigoFormatado,
    loading,
    errorMessage,
    confirmarCodigo,
  };
}