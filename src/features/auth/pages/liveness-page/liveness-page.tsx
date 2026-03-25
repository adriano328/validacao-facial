import { useLocation, Navigate } from "react-router-dom";
import { useLiveness } from "../../hooks/use-liveness";
import { LivenessContainer } from "../../components/login-form/liveness-container/liveness-container";

type LocationState = {
  email?: string;
  senha?: string;
};

export function LivenessPage() {
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  if (!state?.email || !state?.senha) {
    return <Navigate to="/login" replace />;
  }

  const {
    phase,
    sessionId,
    errorMessage,
    isBusy,
    retry,
    handleAnalysisComplete,
    handleError,
  } = useLiveness({
    email: state.email,
    senha: state.senha,
  });

  return (
    <LivenessContainer
      phase={phase}
      sessionId={sessionId}
      errorMessage={errorMessage}
      isBusy={isBusy}
      onRetry={retry}
      onAnalysisComplete={handleAnalysisComplete}
      onError={handleError}
    />
  );
}