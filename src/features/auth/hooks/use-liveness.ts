import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { criarSessaoLiveness } from "../api/liveness";
import { mapCriarSessaoToSessionId } from "../model/liveness.mapper";
import type {
  LivenessPhase,
  UseLivenessParams,
  UseLivenessReturn,
} from "../model/liveness.types";
import { useAuthToken } from "../../../app/providers/auth-token-provider";
import { getLivenessErrorMessage } from "../model/liveness.errors";

type UseLivenessWithDetectorKey = UseLivenessReturn & {
  detectorKey: number;
};

export function useLiveness({
  email,
  senha,
  twoFactorCode,
}: UseLivenessParams & {
  twoFactorCode?: number | null;
}): UseLivenessWithDetectorKey {
  const navigate = useNavigate();
  const { setToken } = useAuthToken();

  const [phase, setPhase] = useState<LivenessPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectorKey, setDetectorKey] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const sessionRequestedRef = useRef(false);
  const handlingAnalysisRef = useRef(false);
  const handlingErrorRef = useRef(false);

  const resetDetector = useCallback(() => {
    setDetectorKey((prev) => prev + 1);
  }, []);

  const resetInternalFlags = useCallback(() => {
    sessionRequestedRef.current = false;
    handlingAnalysisRef.current = false;
    handlingErrorRef.current = false;
  }, []);

  const stopWithError = useCallback(
    (message: string) => {
      resetInternalFlags();
      setSessionId(null);
      setErrorMessage(message);
      setPhase("error");
      resetDetector();
    },
    [resetDetector, resetInternalFlags],
  );

  const start = useCallback(async () => {
    if (!email || !senha) {
      resetInternalFlags();
      setSessionId(null);
      setErrorMessage(null);
      setPhase("idle");
      navigate("/login");
      return;
    }

    if (sessionRequestedRef.current) return;
    sessionRequestedRef.current = true;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setPhase("starting");
      setErrorMessage(null);
      setSessionId(null);

      const response = await criarSessaoLiveness(controller.signal);

      if (controller.signal.aborted || !mountedRef.current) return;

      const normalizedSessionId = mapCriarSessaoToSessionId(response);

      if (!normalizedSessionId) {
        throw new Error("Sessão de liveness inválida.");
      }

      setSessionId(normalizedSessionId);
      setPhase("detecting");
      resetDetector();
    } catch (error) {
      if (controller.signal.aborted || !mountedRef.current) return;

      stopWithError(getLivenessErrorMessage(error));
    } finally {
      if (!controller.signal.aborted) {
        sessionRequestedRef.current = false;
      }
    }
  }, [
    email,
    senha,
    navigate,
    resetDetector,
    resetInternalFlags,
    stopWithError,
  ]);

  const retry = useCallback(async () => {
    abortControllerRef.current?.abort();
    resetInternalFlags();

    setSessionId(null);
    setErrorMessage(null);
    setPhase("idle");
    resetDetector();

    await start();
  }, [resetDetector, resetInternalFlags, start]);

  

  const handleError = useCallback(
    (error: unknown) => {
      if (handlingErrorRef.current) return;
      handlingErrorRef.current = true;

      if (!mountedRef.current) {
        handlingErrorRef.current = false;
        return;
      }

      stopWithError(getLivenessErrorMessage(error));
      handlingErrorRef.current = false;
    },
    [stopWithError],
  );

  useEffect(() => {
    mountedRef.current = true;
    void start();

    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      resetInternalFlags();
    };
  }, [resetInternalFlags, start]);

  return {
    phase,
    sessionId,
    errorMessage,
    isBusy: phase === "starting" || phase === "processing",
    retry,
    start,
    handleAnalysisComplete,
    handleError,
    detectorKey,
  };
}
