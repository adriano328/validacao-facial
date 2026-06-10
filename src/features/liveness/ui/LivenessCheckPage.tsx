import { useEffect, useRef, useState } from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";

import {
  criarSessaoLiveness,
  type ResultadoSessaoLivenessResponse,
} from "@features/liveness/api/livenessApi";
import { livenessDisplayTextPtBR } from "@features/liveness/config/livenessPtBR";
import { alerts } from "@shared/lib/swal";
import { BrandMark } from "@shared/ui/brand/BrandMark";
import { SectionHeader } from "@shared/ui/section-header/SectionHeader";
import "./LivenessCheckPage.css";

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
  subtitle?: string;
  tipText?: string;
  loadingText?: string;
  loadingTipText?: string;
  securityText?: string;
  brandSubtitle?: string;
  footerTitle?: string;
  footerText?: string;
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

const DEFAULT_TITLE = "Validação Facial";
const DEFAULT_SUBTITLE = "Confirme sua identidade seguindo as instruções abaixo.";
const DEFAULT_TIP = "Dica: mantenha o rosto centralizado, em ambiente bem iluminado.";
const DEFAULT_LOADING = "Preparando câmera e sessão de validação facial...";
const DEFAULT_LOADING_TIP = "Aguarde alguns instantes. Vamos abrir a câmera com segurança.";
const DEFAULT_BRAND_SUBTITLE = "Plataforma de Voto Eletrônico COMADEMAT";
const DEFAULT_FOOTER_TITLE = "Sistema seguro e auditável";
const DEFAULT_FOOTER_TEXT = "Privacidade, tecnologia e confiança.";
const DEFAULT_MAX_ATTEMPTS = 1;
const DEFAULT_INTERVAL_MS = 1000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRejected(result: ResultadoSessaoLivenessResponse) {
  return result.status === "FAILED" || result.status === "EXPIRED";
}

function defaultDetectorErrorMessage() {
  return "Falha durante a validação facial. Verifique a câmera e tente novamente.";
}

function FacePlaceholder() {
  return (
    <div className="liveness-facePlaceholder" aria-hidden="true">
      <svg width="70" height="98" viewBox="0 0 70 98" fill="none">
        <rect
          x="7"
          y="8"
          width="56"
          height="82"
          rx="28"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <circle cx="35" cy="49" r="12" stroke="currentColor" strokeWidth="2" />
        <path
          d="M29 47C30.2 45.9 31.7 45.3 33.3 45.3C36.2 45.3 38.8 47.1 40 49.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="31" cy="47" r="1.6" fill="currentColor" />
        <circle cx="39" cy="47" r="1.6" fill="currentColor" />
        <path
          d="M30.5 54.5C33.2 57 36.8 57 39.5 54.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

type LivenessShellProps = {
  children: React.ReactNode;
  brandSubtitle: string;
  footerTitle?: string;
  footerText?: string;
};

function LivenessShell({
  children,
  brandSubtitle,
  footerTitle,
  footerText,
}: LivenessShellProps) {
  return (
    <div className="livenessPage">
      <BrandMark className="livenessBrand" subtitle={brandSubtitle} />

      {children}

      {footerTitle || footerText ? (
        <footer className="livenessFooter">
          {footerTitle ? <strong>{footerTitle}</strong> : null}
          {footerText ? <span>{footerText}</span> : null}
        </footer>
      ) : null}
    </div>
  );
}

export function LivenessCheckPage({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  tipText = DEFAULT_TIP,
  loadingText = DEFAULT_LOADING,
  loadingTipText = DEFAULT_LOADING_TIP,
  brandSubtitle = DEFAULT_BRAND_SUBTITLE,
  footerTitle = DEFAULT_FOOTER_TITLE,
  footerText = DEFAULT_FOOTER_TEXT,
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
          await resetAfterFailure("Não foi possível validar. Tente novamente.");
          return;
        }

        attempts += 1;
        await delay(intervalMs);
      }

      await resetAfterFailure(
        "Não foi possível validar na primeira tentativa. Tente novamente."
      );
    } catch (err) {
      console.error("Erro no polling do liveness:", err);
      await resetAfterFailure("Falha ao validar. Tente novamente.");
    } finally {
      handlingAnalysisRef.current = false;
    }
  }

  function retrySession() {
    handlingErrorRef.current = false;
    handlingAnalysisRef.current = false;
    pollingCancelRef.current = { cancelled: false };
    sessionRequestedRef.current = false;
    setError(null);
    void startSession();
  }

  if (phase === "idle") {
    return (
      <LivenessShell
        brandSubtitle={brandSubtitle}
        footerTitle={footerTitle}
        footerText={footerText}
      >
        <main className="livenessCard" aria-labelledby="liveness-title">
          <SectionHeader
            className="livenessHeader"
            id="liveness-title"
            title={title}
            subtitle={subtitle}
          />

          <div className="livenessTip">
            <span className="livenessTipIcon" aria-hidden="true">i</span>
            <span>{tipText}</span>
          </div>

          <div className="livenessDetectorBox livenessDetectorBox--idle">
            <span className="livenessDetectorLabel">Aguardando reinício</span>
            <FacePlaceholder />
          </div>

          {error ? <p className="livenessError">{error}</p> : null}

          <button className="livenessButton" onClick={retrySession} disabled={loading}>
            {loading ? "Iniciando..." : "Iniciar validação facial"}
            <span aria-hidden="true">→</span>
          </button>
        </main>
      </LivenessShell>
    );
  }

  if (loading && !sessionId) {
    return (
      <LivenessShell brandSubtitle={brandSubtitle}>
        <main className="livenessCard">
          <SectionHeader
            className="livenessHeader"
            title={title}
            subtitle={loadingText}
          />

          <div className="livenessTip">
            <span className="livenessTipIcon" aria-hidden="true">i</span>
            <span>{loadingTipText}</span>
          </div>

          <div className="livenessDetectorBox livenessDetectorBox--loading">
            <span className="livenessLoader" aria-hidden="true" />
            <FacePlaceholder />
          </div>
        </main>
      </LivenessShell>
    );
  }

  return (
    <LivenessShell
      brandSubtitle={brandSubtitle}
      footerTitle={footerTitle}
      footerText={footerText}
    >
      <main className="livenessCard livenessCard--running" aria-labelledby="liveness-title">
        <SectionHeader
          className="livenessHeader"
          id="liveness-title"
          title={title}
          subtitle={subtitle}
        />

        <div className="livenessTip">
          <span className="livenessTipIcon" aria-hidden="true">i</span>
          <span>{tipText}</span>
        </div>

        <div
          className="livenessDetectorBox livenessDetectorBox--running"
          style={detectorHeight ? { height: detectorHeight } : undefined}
        >
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

      </main>
    </LivenessShell>
  );
}
