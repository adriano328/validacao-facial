import { useEffect, useRef, useState } from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import { obterResultadoSessaoLiveness } from "../../../services/liveness";
import { useNavigate } from "react-router-dom";
import { alerts } from "../../../lib/swal";
import { usePessoa } from "../../../context/PessoaContext";

type CreateSessionResponse = { sessionId: string };
type Phase = "idle" | "running" | "success";

export default function LivenessPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [detectorKey, setDetectorKey] = useState(0);
  const { pessoaId } = usePessoa();

  const MAX_TENTATIVAS = 1;
  const INTERVALO_MS = 1000;
  const CONFIDENCE_MIN = 90;
  const sessionRequestedRef = useRef(false);
  const pollingCancelRef = useRef({ cancelled: false });

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function cancelPolling() {
    pollingCancelRef.current.cancelled = true;
  }

  function resetDetectorOnly() {
    setDetectorKey((k) => k + 1);
  }

  function handleSuccess() {
    cancelPolling();
    setError(null);
    alerts.success({ text: 'Cadastro validado com sucesso!' })
    setPhase("success");
    navigate('/login')
  }

  async function createLivenessSession() {
    if (sessionRequestedRef.current) return;
    sessionRequestedRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://85.31.63.50:1030/liveness/criar-sessao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Falha ao criar sessão de liveness");

      const data = (await res.json()) as CreateSessionResponse;

      if (!data.sessionId) throw new Error("sessionId não retornado pela API");

      setSessionId(data.sessionId);
      setPhase("running");
      resetDetectorOnly();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Erro desconhecido");
      sessionRequestedRef.current = false;
      setPhase("idle");
      setSessionId(null);
    } finally {
      setLoading(false);
    }
  }

  async function resetAndRestartScanner(msg?: string) {
    alerts.warn({ text: msg });
    cancelPolling();
    sessionRequestedRef.current = false;
    setError(msg ?? null);
    setPhase("idle");
    setSessionId(null);
    resetDetectorOnly();
    pollingCancelRef.current = { cancelled: false };
    await createLivenessSession();
  }

  useEffect(() => {
    createLivenessSession();
    return () => {
      cancelPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "idle") {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <h2>Validação Facial (Liveness)</h2>

        {error && <p style={{ marginTop: 12 }}>{error}</p>}

        <button
          onClick={() => {
            setError(null);
            createLivenessSession();
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
          onAnalysisComplete={async () => {
            // token de cancelamento para este polling
            pollingCancelRef.current = { cancelled: false };

            try {
              let tentativas = 0;

              while (tentativas < MAX_TENTATIVAS) {
                if (pollingCancelRef.current.cancelled) return;

                const resultado = await obterResultadoSessaoLiveness(
                  sessionId,
                  String(pessoaId)
                );

                if (pollingCancelRef.current.cancelled) return;

                console.log(`Tentativa ${tentativas + 1}`, resultado);
                if (
                  resultado.status === "SUCCEEDED" &&
                  resultado.confidence >= CONFIDENCE_MIN
                ) {
                  handleSuccess();
                  return;
                }

                if (
                  resultado.status === "FAILED" ||
                  resultado.status === "EXPIRED"
                ) {
                  await resetAndRestartScanner(
                    "Não foi possível validar. Vamos tentar novamente."
                  );
                  return;
                }

                tentativas++;
                await delay(INTERVALO_MS);
              }
              await resetAndRestartScanner(
                "Não foi possível validar na primeira tentativa. Tente novamente."
              );
            } catch (err) {
              console.error("Erro no polling do liveness:", err);
              await resetAndRestartScanner(
                "Falha ao validar. Vamos abrir o scanner novamente."
              );
            }
          }}
          onError={async (err: any) => {
            console.error("Erro no FaceLivenessDetector:", err);

            if (err?.state === "MOBILE_LANDSCAPE_ERROR") {
              await resetAndRestartScanner(
                "Use o celular em modo retrato (vertical) e tente novamente."
              );
              return;
            }

            await resetAndRestartScanner(
              "Falha durante a validação facial. Vamos abrir o scanner novamente."
            );
          }}
        />
      ) : null}
    </div>
  );
}
