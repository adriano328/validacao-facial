import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import styles from "./liveness-container.module.css";
import type { LivenessPhase } from "../../../model/liveness.types";
import { livenessDisplayTextPtBR } from "../../../../../shared/lib/liveness-display-text-ptbr";

type LivenessContainerProps = {
  phase: LivenessPhase;
  sessionId: string | null;
  errorMessage: string | null;
  isBusy: boolean;
  onRetry: () => void;
  onAnalysisComplete: () => Promise<void>;
  onError: (error: unknown) => void;
};

export function LivenessContainer({
  phase,
  sessionId,
  errorMessage,
  isBusy,
  onRetry,
  onAnalysisComplete,
  onError,
}: LivenessContainerProps) {
  return (
    <div className={styles.livenessPage}>
      <div className={styles.livenessCard}>
        <header className={styles.livenessHeader}>
          <h1 className={styles.livenessTitle}>Validação facial</h1>
          <p className={styles.livenessSubtitle}>
            Posicione seu rosto corretamente para concluir o acesso.
          </p>
        </header>

        <div className={styles.livenessBody}>
          <div className={styles.livenessHint}>
            <div className={styles.livenessHintIcon}>i</div>
            <div>
              <strong>Dica:</strong> fique em local iluminado e mantenha apenas
              um rosto visível na câmera.
            </div>
          </div>

          {errorMessage ? (
            <div className={styles.livenessError}>{errorMessage}</div>
          ) : null}

          {(phase === "starting" || phase === "processing") && (
            <div className={styles.livenessLoading}>
              <div className={styles.livenessSpinner} />
              <p className={styles.livenessLoadingText}>
                {phase === "starting"
                  ? "Preparando validação facial..."
                  : "Processando validação..."}
              </p>
            </div>
          )}

          {phase === "detecting" && sessionId ? (
            <div className={styles.livenessDetectorWrap}>
              <FaceLivenessDetector
                sessionId={sessionId}
                region="us-east-1"
                displayText={livenessDisplayTextPtBR}
                onAnalysisComplete={onAnalysisComplete}
                onError={onError}
              />
            </div>
          ) : null}

          {phase === "error" && (
            <div className={styles.livenessActions}>
              <button
                type="button"
                className={styles.livenessButton}
                onClick={onRetry}
                disabled={isBusy}
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}