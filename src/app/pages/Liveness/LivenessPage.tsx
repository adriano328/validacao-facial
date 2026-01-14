import { useEffect, useRef, useState } from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import {
  criarSessaoLiveness,
  obterResultadoSessaoLiveness,
} from "../../../services/liveness";

export function LivenessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null); // AWS sessionId
  const [idSessao, setIdSessao] = useState<string | null>(null);   // id interno backend

  const idPessoa = "123"; 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRequestedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  async function createLivenessSession() {
    if (sessionRequestedRef.current) return;
    sessionRequestedRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const hasMediaDevices =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function";

    if (!hasMediaDevices) {
      return (
        <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
          <h2>Validação Facial</h2>
          <p>
            Seu navegador ou ambiente não liberou acesso à câmera.
            Abra em <b>HTTPS</b> ou em <b>http://localhost</b>.
          </p>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            Dica: acessar via IP (ex.: 192.x.x.x) sem HTTPS bloqueia o uso da câmera.
          </p>
        </div>
      );
    }

    try {
      const data = await criarSessaoLiveness(controller.signal);
      console.log("criarSessaoLiveness:", data);
      const backendIdSessao = "idSessao" in data ? (data as any).idSessao : undefined;
      const awsSessionId = "sessionId" in data ? (data as any).sessionId : undefined;
      if (!awsSessionId) throw new Error("sessionId não retornado pela API");
      if (backendIdSessao) setIdSessao(String(backendIdSessao));
      setSessionId(String(awsSessionId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(msg);
      sessionRequestedRef.current = false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    createLivenessSession();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !sessionId) {
    return (
      <p style={{ textAlign: "center", marginTop: 40 }}>
        Preparando câmera e sessão de validação facial…
      </p>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <p>{error}</p>
        <button
          onClick={() => {
            sessionRequestedRef.current = false;
            setSessionId(null);
            setIdSessao(null);
            createLivenessSession();
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Validação Facial (Liveness)</h2>

      {/* ✅ assim que sessionId existir, o detector renderiza */}
      {sessionId ? (
        <FaceLivenessDetector
          sessionId={sessionId}
          region="us-east-1"
          onAnalysisComplete={async () => {
            console.log("✅ Análise de liveness concluída");

            // só chama resultado se você tiver idSessao
            if (!idSessao) return;

            try {
              const result = await obterResultadoSessaoLiveness(idSessao, idPessoa);
              console.log("📌 Resultado:", result);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Falha ao obter resultado";
              setError(msg);
            }
          }}
          onError={(err: unknown) => {
            console.error("Erro no FaceLivenessDetector:", err);

            if (
              typeof err === "object" &&
              err !== null &&
              "state" in err &&
              (err as { state?: string }).state === "MOBILE_LANDSCAPE_ERROR"
            ) {
              setError("Use o celular em modo retrato (vertical) para continuar.");
              return;
            }

            setError("Falha durante a validação facial");
          }}
        />
      ) : (
        <button onClick={createLivenessSession}>Iniciar validação facial</button>
      )}
    </div>
  );
}
