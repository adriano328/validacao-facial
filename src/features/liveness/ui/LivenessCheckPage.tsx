import { useEffect, useRef, useState } from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";

import {
  criarSessaoLiveness,
  type ResultadoSessaoLivenessResponse,
} from "@features/liveness/api/livenessApi";
import { livenessDisplayTextPtBR } from "@features/liveness/config/livenessPtBR";
import { alerts } from "@shared/lib/swal";

type Phase = "idle" | "running" | "success";

type LivenessUiError = {
  state?: string;
};

type ApprovalResult =
  | void
  | {
      ok: boolean;
      message?: string;
    };

type LivenessCheckPageProps = {
  title?: string;
  detectorHeight?: number;
  maxAttempts?: number;
  intervalMs?: number;
  resolveResult: (
    sessionId: string
  ) => Promise<ResultadoSessaoLivenessResponse>;
  isApproved: (result: ResultadoSessaoLivenessResponse) => boolean;
  onApproved: (
    result: ResultadoSessaoLivenessResponse
  ) => Promise<ApprovalResult> | ApprovalResult;
  formatDetectorError?: (error: LivenessUiError) => string;
};

const DEFAULT_TITLE = "Validacao Facial (Liveness)";
const DEFAULT_MAX_ATTEMPTS = 1;
const DEFAULT_INTERVAL_MS = 1000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRejected(result: ResultadoSessaoLivenessResponse) {
  return result.status === "FAILED" || result.status === "EXPIRED";
}

function defaultDetectorErrorMessage() {
  return "Falha durante a validacao facial. Verifique a camera e tente novamente.";
}

export function LivenessCheckPage({
  title = DEFAULT_TITLE,
  detectorHeight,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  intervalMs = DEFAULT_INTERVAL_MS,
  resolveResult,
  isApproved,
  onApproved,
  formatDetectorError = defaultDetectorErrorMessage,
}: LivenessCheckPageProps) {
  const sessionRequestedRef = useRef(false);
  const pollingCancelRef = useRef({ cancelled: false });
  const handlingErrorRef = useRef(false);
  const handlingAnalysisRef = useRef(false);
  const mountedRef = useRef(true);

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectorKey, setDetectorKey] = useState(0);

  function cancelPolling() {
    pollingCancelRef.current.cancelled = true;
  }

  function resetDetectorOnly() {
    setDetectorKey((current) => current + 1);
  }

  function stopWithError(message: string) {
    cancelPolling();
    sessionRequestedRef.current = false;
    setLoading(false);
    setSessionId(null);
    setPhase("idle");
    setError(message);
  }

  async function resetAfterFailure(message: string) {
    if (!mountedRef.current) return;

    alerts.warn({ text: message });
    stopWithError(message);
    resetDetectorOnly();

    pollingCancelRef.current = { cancelled: false };
    handlingErrorRef.current = false;
    handlingAnalysisRef.current = false;
  }

  async function startSession() {
    if (sessionRequestedRef.current) return;

    sessionRequestedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await criarSessaoLiveness();
      setSessionId(data.sessionId);
      setPhase("running");
      resetDetectorOnly();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      sessionRequestedRef.current = false;
      setPhase("idle");
      setSessionId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    void startSession();

    return () => {
      mountedRef.current = false;
      cancelPolling();
    };
  }, []);

  async function handleAnalysisComplete(currentSessionId: string) {
    if (handlingAnalysisRef.current) return;

    handlingAnalysisRef.current = true;
    pollingCancelRef.current = { cancelled: false };

    try {
      let attempts = 0;

      while (attempts < maxAttempts) {
        if (pollingCancelRef.current.cancelled) return;

        const result = await resolveResult(currentSessionId);

        if (pollingCancelRef.current.cancelled) return;

        if (isApproved(result)) {
          const approval = await onApproved(result);

          if (approval?.ok === false) {
            await resetAfterFailure(
              approval.message ?? "Falha ao validar. Tente novamente."
            );
            return;
          }

          cancelPolling();
          setError(null);
          setPhase("success");
          return;
        }

        if (isRejected(result)) {
          await resetAfterFailure("Nao foi possivel validar. Tente novamente.");
          return;
        }

        attempts += 1;
        await delay(intervalMs);
      }

      await resetAfterFailure(
        "Nao foi possivel validar na primeira tentativa. Tente novamente."
      );
    } catch (err) {
      console.error("Erro no polling do liveness:", err);
      await resetAfterFailure("Falha ao validar. Tente novamente.");
    } finally {
      handlingAnalysisRef.current = false;
    }
  }

  if (phase === "idle") {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <h2>{title}</h2>

        {error ? <p style={{ marginTop: 12 }}>{error}</p> : null}

        <button
          onClick={() => {
            handlingErrorRef.current = false;
            handlingAnalysisRef.current = false;
            pollingCancelRef.current = { cancelled: false };
            sessionRequestedRef.current = false;
            setError(null);
            void startSession();
          }}
          disabled={loading}
          style={{ marginTop: 12 }}
        >
          {loading ? "Iniciando..." : "Iniciar validacao facial"}
        </button>
      </div>
    );
  }

  if (loading && !sessionId) {
    return (
      <p style={{ textAlign: "center", marginTop: 40 }}>
        Preparando camera e sessao de validacao facial...
      </p>
    );
  }

  return (
    <div style={{ maxWidth: 520, height: detectorHeight, margin: "40px auto" }}>
      <h2>{title}</h2>

      {phase === "running" && sessionId ? (
        <FaceLivenessDetector
          key={`${detectorKey}-${sessionId}`}
          sessionId={sessionId}
          region="us-east-1"
          displayText={livenessDisplayTextPtBR}
          onAnalysisComplete={() => handleAnalysisComplete(sessionId)}
          onError={async (err: LivenessUiError) => {
            if (handlingErrorRef.current) return;

            handlingErrorRef.current = true;
            console.error("Erro no FaceLivenessDetector:", err);

            await resetAfterFailure(formatDetectorError(err));
          }}
        />
      ) : null}
    </div>
  );
}
