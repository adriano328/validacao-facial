import { useEffect, useRef, useState } from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import {
  compararFaces,
  obterResultadoSessaoLiveness,
  type CompararFacesRequest,
} from "../../../services/liveness";
import { alerts } from "../../../lib/swal";
import { usePessoa } from "../../../context/PessoaContext";
import { livenessDisplayTextPtBR } from "../../../i18n/livenessPtBR";
import { useAuthToken } from "../../../context/AuthTokenContext";
import { useNavigate } from "react-router-dom";

import "./ValidPage.css";

type CreateSessionResponse = { sessionId: string };
type Phase = "idle" | "running" | "success";

export default function ValidPage() {
  const { email, senha } = usePessoa();
  const { setToken } = useAuthToken();
  const navigate = useNavigate();

  const emailRef = useRef<string | null>(null);
  const senhaRef = useRef<string | null>(null);

  useEffect(() => {
    emailRef.current = email ?? null;
    senhaRef.current = senha ?? null;
  }, [email, senha]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectorKey, setDetectorKey] = useState(0);

  const MAX_TENTATIVAS = 1;
  const INTERVALO_MS = 1000;

  const sessionRequestedRef = useRef(false);
  const pollingCancelRef = useRef({ cancelled: false });
  const handlingErrorRef = useRef(false);
  const handlingAnalysisRef = useRef(false);
  const mountedRef = useRef(true);

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function cancelPolling() {
    pollingCancelRef.current.cancelled = true;
  }

  function resetDetectorOnly() {
    setDetectorKey((k) => k + 1);
  }

  function stopWithError(message: string) {
    cancelPolling();
    sessionRequestedRef.current = false;

    setLoading(false);
    setSessionId(null);
    setPhase("idle");
    setError(message);
  }

  async function handleSuccess(foto: string) {
    const currentEmail = emailRef.current;
    const currentSenha = senhaRef.current;

    if (!currentEmail) {
      await resetAndRestartScanner(
        "E-mail não encontrado. Volte e tente novamente.",
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
      const res = await compararFaces(payload);

      if (res?.token) {
        setToken(res.token);
        cancelPolling();
        setError(null);
        setPhase("success");
        navigate("/home");
        return;
      }

      await resetAndRestartScanner(
        "Não foi possível concluir a validação. Tente novamente.",
      );
    } catch (e) {
      console.error("Erro no compararFaces:", e);
      await resetAndRestartScanner("Falha ao comparar faces. Tente novamente.");
    }
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

  async function resetAndRestartScanner(msg?: string) {
    const text =
      msg ??
      "Falha durante a validação facial. Verifique a câmera e tente novamente.";
    if (!mountedRef.current) return;

    alerts.warn({ text });
    stopWithError(text);

    resetDetectorOnly();

    pollingCancelRef.current = { cancelled: false };
    handlingErrorRef.current = false;
    handlingAnalysisRef.current = false;
  }

  useEffect(() => {
    mountedRef.current = true;
    createLivenessSession();

    return () => {
      mountedRef.current = false;
      cancelPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "idle") {
    return (
      <div className="validPage">
        <div className="validCard">
          <div className="validHeader">
            <h2 className="validTitle">Validação Facial</h2>
            <p className="validSubtitle">
              Para sua segurança, confirme sua identidade usando a câmera.
            </p>
          </div>

          <div className="validBody">
            <div className="validHint">
              <div className="validHintIcon">i</div>
              <div>
                <strong>Dica rápida</strong>
                <br />
                Use boa iluminação, retire acessórios que cubram o rosto e
                mantenha a câmera estável.
              </div>
            </div>

            {error && <div className="validError">{error}</div>}

            <div className="validActions">
              <button
                className="validButton"
                onClick={() => {
                  handlingErrorRef.current = false;
                  handlingAnalysisRef.current = false;
                  pollingCancelRef.current = { cancelled: false };
                  sessionRequestedRef.current = false;

                  setError(null);
                  createLivenessSession();
                }}
                disabled={loading}
              >
                {loading ? "Iniciando..." : "Iniciar validação facial"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !sessionId) {
    return (
      <div className="validPage">
        <div className="validCard validLoading">
          <div className="validSpinner" />
          <p className="validLoadingText">
            Preparando câmera e sessão de validação…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="validPage">
      <div className="validCard">
        <div className="validHeader">
          <h2 className="validTitle">Validação Facial</h2>
          <p className="validSubtitle">
            Centralize o rosto e siga as instruções na tela.
          </p>
        </div>

        <div className="validBody">
          {phase === "running" && sessionId ? (
            <div className="validDetectorWrap">
              <FaceLivenessDetector
                key={`${detectorKey}-${sessionId}`}
                sessionId={sessionId}
                region="us-east-1"
                displayText={livenessDisplayTextPtBR}
                onAnalysisComplete={async () => {
                  if (handlingAnalysisRef.current) return;
                  handlingAnalysisRef.current = true;

                  pollingCancelRef.current = { cancelled: false };

                  try {
                    let tentativas = 0;

                    while (tentativas < MAX_TENTATIVAS) {
                      if (pollingCancelRef.current.cancelled) return;

                      const resultado = await obterResultadoSessaoLiveness(
                        sessionId,
                      );

                      if (pollingCancelRef.current.cancelled) return;

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

                      tentativas++;
                      await delay(INTERVALO_MS);
                    }

                    await resetAndRestartScanner(
                      "Não foi possível validar na primeira tentativa. Tente novamente.",
                    );
                  } catch (err) {
                    console.error("Erro no polling do liveness:", err);
                    await resetAndRestartScanner(
                      "Falha ao validar. Tente novamente.",
                    );
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
                        ? "Não foi possível acessar a câmera. Verifique a permissão e tente novamente."
                        : "Falha durante a validação facial. Verifique a câmera e tente novamente.";

                  await resetAndRestartScanner(msg);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
