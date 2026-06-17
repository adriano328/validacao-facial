import { useNavigate } from "react-router-dom";

import { useAuthFlow } from "@features/auth/model/AuthFlowContext";
import { useAuthToken } from "@features/auth/model/AuthTokenContext";
import {
  compararFaces,
  obterResultadoSessaoLiveness,
  type CompararFacesRequest,
  type ResultadoSessaoLivenessResponse,
} from "@features/liveness/api/livenessApi";
import { LivenessCheckPage } from "@features/liveness/ui/LivenessCheckPage";

export default function AuthLivenessPage() {
  const { email, senha, clearAuthFlow } = useAuthFlow();
  const { setToken } = useAuthToken();
  const navigate = useNavigate();

  async function handleApproved(result: ResultadoSessaoLivenessResponse) {
    if (!email) {
      return {
        ok: false,
        message: "Email nao encontrado. Volte e tente novamente.",
      };
    }

    if (!senha) {
      return {
        ok: false,
        message: "Senha nao encontrada. Volte e tente novamente.",
      };
    }

    const payload: CompararFacesRequest = {
      source: result.foto,
      email,
      senha,
    };

    try {
      const response = await compararFaces(payload);

      if (!response.token) {
        return { ok: false, message: "Token nao retornado pela API." };
      }

      setToken(response.token);
      clearAuthFlow();
      navigate("/home", { replace: true });

      return { ok: true };
    } catch (err) {
      console.error("Erro no compararFaces:", err);
      return {
        ok: false,
        message: "Falha ao comparar faces. Tente novamente.",
      };
    }
  }

  return (
    <LivenessCheckPage
      disableStartScreen
      resolveResult={(sessionId) => obterResultadoSessaoLiveness(sessionId)}
      isApproved={(result) => result.status === "SUCCEEDED"}
      onApproved={handleApproved}
    />
  );
}
