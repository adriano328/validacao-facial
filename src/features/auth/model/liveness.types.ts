export type LivenessPhase =
  | "idle"
  | "starting"
  | "detecting"
  | "processing"
  | "success"
  | "error";

export type LivenessPageLocationState = {
  email: string;
  senha: string;
};

export type UseLivenessParams = {
  email: string;
  senha: string;
};

export type UseLivenessReturn = {
  phase: LivenessPhase;
  sessionId: string | null;
  errorMessage: string | null;
  isBusy: boolean;
  retry: () => Promise<void>;
  start: () => Promise<void>;
  handleAnalysisComplete: () => Promise<void>;
  handleError: (error: unknown) => void;
};