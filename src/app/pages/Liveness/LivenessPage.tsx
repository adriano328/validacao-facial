import { useEffect, useRef, useState } from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import { criarSessaoLiveness, obterResultadoSessaoLiveness } from "../../services/liveness";
// ajuste o path acima conforme sua estrutura

export function LivenessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [idSessao, setIdSessao] = useState<string | null>(null);

  // você precisa obter isso do seu fluxo (cadastro/login/rota)
  const idPessoa = "123"; // TODO: substituir pelo id real

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // evita duplicar no StrictMode
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

    try {
      const data = await criarSessaoLiveness(controller.signal);

      // backend pode retornar "idSessao" e/ou "sessionId"
      const sessao = data.idSessao;
      const sessId = data.sessionId ?? data.idSessao; // fallback comum

      if (!sessao) throw new Error("idSessao não retornado pela API");
      if (!sessId) throw new Error("sessionId não retornado pela API");

      setIdSessao(sessao);
      setSessionId(sessId);
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

      {sessionId ? (
        <FaceLivenessDetector
          sessionId={sessionId}
          region="us-east-1"
          onAnalysisComplete={async () => {
            console.log("✅ Análise de liveness concluída");

            // opcional: buscar resultado no backend após concluir
            if (idSessao) {
              try {
                const result = await obterResultadoSessaoLiveness(idSessao, idPessoa);
                console.log("📌 Resultado:", result);
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "Falha ao obter resultado";
                setError(msg);
              }
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
