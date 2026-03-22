import { useEffect, useRef, useState } from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import { useNavigate, useLocation } from "react-router-dom";
import { alerts } from "../../../lib/swal";
import { usePessoa } from "../../../context/PessoaContext";
import { livenessDisplayTextPtBR } from "../../../i18n/livenessPtBR";
import { handleAxiosError } from "../../../utils/messageErro";
import { login } from "../../../services/usuario";

type CreateSessionResponse = { sessionId: string };
type Phase = "idle" | "running" | "success";

export default function LivenessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pessoaId } = usePessoa();

  const state = location.state as {
    email?: string;
    senha?: string;
    twoFactorCode?: number;
  } | null;

  const email = state?.email ?? "";
  const senha = state?.senha ?? "";
  const twoFactorCode = state?.twoFactorCode ?? null;

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectorKey, setDetectorKey] = useState(0);

  const sessionRequestedRef = useRef(false);
  const handlingErrorRef = useRef(false);
  const handlingAnalysisRef = useRef(false);
  const mountedRef = useRef(true);

  function resetDetectorOnly() {
    setDetectorKey((k) => k + 1);
  }

  async function handleSuccess(validSessionId: string) {
    setError(null);

    try {
      const response = await login({
        email,
        senha,
        idSessaoLiveness: validSessionId,
        twoFactorCode,
      });

      if (response?.qrCodeUrl) {
        navigate("/2fa-setup", {
          state: {
            qrCodeUrl: response.qrCodeUrl,
            secret: response.secret,
            email,
            senha,
            idSessaoLiveness: validSessionId,
          },
        });
        return;
      }

      alerts.success({ text: "Login realizado com sucesso!" });
      setPhase("success");
      navigate("/home");
    } catch (err) {
      const message = handleAxiosError(err);
      alerts.error({ text: message });
      navigate("/login");
    }
  }

  function stopWithError(message: string) {
    sessionRequestedRef.current = false;
    setLoading(false);
    setSessionId(null);
    setPhase("idle");
    setError(message);
  }

  async function createLivenessSession() {
    if (sessionRequestedRef.current) return;
    sessionRequestedRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://ihvjqtwvo5.execute-api.us-east-1.amazonaws.com/test/liveness/criar-sessao",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        throw new Error("Falha ao criar sessão de liveness");
      }

      const data = (await res.json()) as CreateSessionResponse;

      if (!data.sessionId) {
        throw new Error("sessionId não retornado pela API");
      }

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
    if (!email || !senha) {
      alerts.warn({ text: "Sessão inválida. Faça login novamente." });
      navigate("/login");
      return;
    }
  }, [email, senha, navigate]);

  useEffect(() => {
    mountedRef.current = true;
    createLivenessSession();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (phase === "idle") {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <h2>Validação Facial (Liveness)</h2>

        {error && <p style={{ marginTop: 12 }}>{error}</p>}

        <button
          onClick={() => {
            handlingErrorRef.current = false;
            handlingAnalysisRef.current = false;
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
    <div style={{ maxWidth: 520, height: 300, margin: "40px auto" }}>
      <h2>Validação Facial (Liveness)</h2>

      {phase === "running" && sessionId ? (
        <FaceLivenessDetector
          key={`${detectorKey}-${sessionId}`}
          sessionId={sessionId}
          region="us-east-1"
          displayText={livenessDisplayTextPtBR}
          onAnalysisComplete={async () => {
            if (handlingAnalysisRef.current) return;
            handlingAnalysisRef.current = true;

            try {
              await handleSuccess(sessionId);
            } catch (err) {
              console.error("Erro ao concluir análise do liveness:", err);

              const message =
                err instanceof Error
                  ? err.message
                  : "Falha ao concluir a validação facial.";

              if (!mountedRef.current) return;

              alerts.warn({ text: message });
              stopWithError(message);
            } finally {
              handlingAnalysisRef.current = false;
            }
          }}
          onError={async (err: any) => {
            if (handlingErrorRef.current) return;
            handlingErrorRef.current = true;

            console.error("Erro no FaceLivenessDetector:", err);

            const msg =
              err?.state === "MOBILE_LANDSCAPE_ERROR"
                ? "Use o celular em modo retrato (vertical) e tente novamente."
                : err?.state === "CAMERA_ACCESS_ERROR"
                  ? "Não foi possível acessar a câmera. Verifique permissão e se há câmera disponível."
                  : "Falha durante a validação facial. Verifique a câmera e tente novamente.";

            if (!mountedRef.current) return;

            alerts.warn({ text: msg });
            stopWithError(msg);
            handlingErrorRef.current = false;
          }}
        />
      ) : null}
    </div>
  );
}