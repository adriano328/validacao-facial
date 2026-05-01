import { useNavigate } from "react-router-dom";

import { useAuthFlow } from "@features/auth/model/AuthFlowContext";
import {
  obterResultadoSessaoLiveness,
  type ResultadoSessaoLivenessResponse,
} from "@features/liveness/api/livenessApi";
import { LivenessCheckPage } from "@features/liveness/ui/LivenessCheckPage";
import { alerts } from "@shared/lib/swal";

type LivenessUiError = {
  state?: string;
};

const CONFIDENCE_MIN = 90;

function formatDetectorError(err: LivenessUiError) {
  if (err?.state === "MOBILE_LANDSCAPE_ERROR") {
    return "Use o celular em modo retrato (vertical) e tente novamente.";
  }

  if (err?.state === "CAMERA_ACCESS_ERROR") {
    return "Nao foi possivel acessar a camera. Verifique permissao e se ha camera disponivel.";
  }

  return "Falha durante a validacao facial. Verifique a camera e tente novamente.";
}

export default function RegistrationLivenessPage() {
  const navigate = useNavigate();
  const { pessoaId } = useAuthFlow();

  function handleApproved() {
    alerts.success({ text: "Cadastro validado com sucesso!" });
    navigate("/login");

    return { ok: true };
  }

  function resolveRegistrationResult(sessionId: string) {
    return obterResultadoSessaoLiveness(
      sessionId,
      pessoaId ? String(pessoaId) : undefined
    );
  }

  function isRegistrationApproved(result: ResultadoSessaoLivenessResponse) {
    return result.status === "SUCCEEDED" && result.confidence >= CONFIDENCE_MIN;
  }

  return (
    <LivenessCheckPage
      detectorHeight={300}
      resolveResult={resolveRegistrationResult}
      isApproved={isRegistrationApproved}
      onApproved={handleApproved}
      formatDetectorError={formatDetectorError}
    />
  );
}
