import { useEffect, useRef, useState } from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import { useNavigate } from "react-router-dom";
import {
  compararFaces,
  obterResultadoSessaoLiveness,
  type CompararFacesRequest,
} from "../../../services/liveness";
import { alerts } from "../../../lib/swal";
import { usePessoa } from "../../../context/PessoaContext";
import { livenessDisplayTextPtBR } from "../../../i18n/livenessPtBR";
import { useAuthToken } from "../../../auth/AuthTokenContext";

type CreateSessionResponse = {
  sessionId: string;
};

type Phase = "idle" | "running" | "success";

export default function ValidPage() {
  const { email, senha } = usePessoa();
  const { setToken } = useAuthToken();
  const navigate = useNavigate();

  const emailRef = useRef<string | null>(null);
  const senhaRef = useRef<string | null>(null);
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

  const MAX_TENTATIVAS = 1;
  const INTERVALO_MS = 1000;

  useEffect(() => {
    emailRef.current = email ?? null;
    senhaRef.current = senha ?? null;
  }, [email, senha]);

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

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

  async function resetAndRestartScanner(message?: string) {
    const text = message ?? "Falha durante a validação facial. Tente novamente.";

    if (!mountedRef.current) {
      return;
    }

    alerts.warn({ text });
    stopWithError(text);
    resetDetectorOnly();

    pollingCancelRef.current = { cancelled: false };
    handlingErrorRef.current = false;
    handlingAnalysisRef.current = false;
  }

  async function handleSuccess(foto: string) {
    const currentEmail = emailRef.current;
    const currentSenha = senhaRef.current;

    if (!currentEmail) {
      await resetAndRestartScanner(
        "Email não encontrado. Volte e tente novamente.",
      );
      return;
    }

    if (!currentSenha) {
      await resetAndRestartScanner(
        "Senha não encontrada. Volte e tente novamente.",
      );
      return;
    }

    const payload: CompararFacesRequest = {
      source: foto,
      email: currentEmail,
      senha: currentSenha,
    };

    try {
      const response = await compararFaces(payload);

      if (!response.token) {
        await resetAndRestartScanner("Token não retornado pela API.");
        return;
      }

      setToken(response.token);
      cancelPolling();
      setError(null);
      setPhase("success");
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Erro no compararFaces:", error);
      await resetAndRestartScanner("Falha ao comparar faces. Tente novamente.");
    }
  }

  async function createLivenessSession() {
    if (sessionRequestedRef.current) {
      return;
    }

    sessionRequestedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://ihvjqtwvo5.execute-api.us-east-1.amazonaws.com/test/liveness/criar-sessao",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error("Falha ao criar sessão de liveness");
      }

      const data = (await response.json()) as CreateSessionResponse;

      if (!data.sessionId) {
        throw new Error("sessionId não retornado pela API");
      }

      setSessionId(data.sessionId);
      setPhase("running");
      resetDetectorOnly();
    } catch (error: unknown) {
      console.error(error);
      setError(
        error instanceof Error ? error.message : "Erro desconhecido",
      );
      sessionRequestedRef.current = false;
      setPhase("idle");
      setSessionId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    void createLivenessSession();

    return () => {
      mountedRef.current = false;
      cancelPolling();
    };
  }, []);

  if (phase === "idle") {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <h2>Validação Facial (Liveness)</h2>

        {error ? <p style={{ marginTop: 12 }}>{error}</p> : null}

        <button
          onClick={() => {
            handlingErrorRef.current = false;
            handlingAnalysisRef.current = false;
            pollingCancelRef.current = { cancelled: false };
            sessionRequestedRef.current = false;
            setError(null);
            void createLivenessSession();
          }}
          disabled={loading}
          style={{ marginTop: 12 }}
        >
          {loading ? "Iniciando..." : "Iniciar validação facial"}
        </button>
      </div>
    );
  }

  if (loading && !sessionId) {
    return (
      <p style={{ textAlign: "center", marginTop: 40 }}>
        Preparando câmera e sessão de validação facial…
      </p>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Validação Facial (Liveness)</h2>

      {phase === "running" && sessionId ? (
        <FaceLivenessDetector
          key={`${detectorKey}-${sessionId}`}
          sessionId={sessionId}
          region="us-east-1"
          displayText={livenessDisplayTextPtBR}
          onAnalysisComplete={async () => {
            if (handlingAnalysisRef.current) {
              return;
            }

            handlingAnalysisRef.current = true;
            pollingCancelRef.current = { cancelled: false };

            try {
              let tentativas = 0;

              while (tentativas < MAX_TENTATIVAS) {
                if (pollingCancelRef.current.cancelled) {
                  return;
                }

                const resultado = await obterResultadoSessaoLiveness(sessionId);

                if (pollingCancelRef.current.cancelled) {
                  return;
                }

                if (resultado.status === "SUCCEEDED") {
                  await handleSuccess(resultado.foto);
                  return;
                }

                if (
                  resultado.status === "FAILED" ||
                  resultado.status === "EXPIRED"
                ) {
                  await resetAndRestartScanner(
                    "Não foi possível validar. Tente novamente.",
                  );
                  return;
                }

                tentativas += 1;
                await delay(INTERVALO_MS);
              }

              await resetAndRestartScanner(
                "Não foi possível validar na primeira tentativa. Tente novamente.",
              );
            } catch (error) {
              console.error("Erro no polling do liveness:", error);
              await resetAndRestartScanner("Falha ao validar. Tente novamente.");
            } finally {
              handlingAnalysisRef.current = false;
            }
          }}
          onError={async (error: unknown) => {
            if (handlingErrorRef.current) {
              return;
            }

            handlingErrorRef.current = true;
            console.error("Erro no FaceLivenessDetector:", error);

            try {
              await resetAndRestartScanner(
                "Falha durante a validação facial. Verifique a câmera e tente novamente.",
              );
            } finally {
              handlingErrorRef.current = false;
            }
          }}
        />
      ) : null}
    </div>
  );
}