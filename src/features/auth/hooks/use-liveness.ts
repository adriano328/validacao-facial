// features/auth/hooks/use-liveness.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  criarSessaoLiveness,
  compararFaces,
} from "../api/liveness";
import {
  getLivenessErrorMessage,
  mapCriarSessaoToSessionId,
} from "../model/liveness.mapper";
import type {
  LivenessPhase,
  UseLivenessParams,
  UseLivenessReturn,
} from "../model/liveness.types";
import { useAuthToken } from "../../../context/AuthTokenContext";

export function useLiveness({
  email,
  senha,
}: UseLivenessParams): UseLivenessReturn {
  const navigate = useNavigate();
  const { setToken } = useAuthToken();

  const [phase, setPhase] = useState<LivenessPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setPhase("starting");
      setErrorMessage(null);

      const response = await criarSessaoLiveness(controller.signal);
      const normalizedSessionId = mapCriarSessaoToSessionId(response);

      setSessionId(normalizedSessionId);
      setPhase("detecting");
    } catch (error) {
      if (controller.signal.aborted) return;

      setErrorMessage("Não foi possível iniciar a validação facial.");
      setPhase("error");
    }
  }, []);

  const retry = useCallback(async () => {
    setSessionId(null);
    setErrorMessage(null);
    await start();
  }, [start]);

  const handleAnalysisComplete = useCallback(async () => {
    if (!sessionId) return;

    try {
      setPhase("processing");

      const response = await compararFaces({
        source: sessionId,
        email,
        senha,
      });

      setToken(response.token);
      setPhase("success");
      navigate("/home");
    } catch (error) {
      setErrorMessage("Não foi possível validar o rosto com sucesso.");
      setPhase("error");
    }
  }, [email, senha, sessionId, setToken, navigate]);

  const handleError = useCallback((error: unknown) => {
    setErrorMessage(getLivenessErrorMessage(error));
    setPhase("error");
  }, []);

  useEffect(() => {
    void start();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [start]);

  return {
    phase,
    sessionId,
    errorMessage,
    isBusy: phase === "starting" || phase === "processing",
    retry,
    start,
    handleAnalysisComplete,
    handleError,
  };
}