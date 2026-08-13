import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { DocumentTypeStep } from "@features/document-verification/ui/DocumentTypeStep";
import { useDocumentVerification } from "@features/document-verification/model/useDocumentVerification";
import { DocumentCaptureStep } from "@features/document-verification/ui/steps/DocumentCaptureStep";
import { ReviewSubmitStep } from "@features/document-verification/ui/steps/ReviewSubmitStep";

import { alerts } from "@shared/lib/swal";
import type { DocumentSide } from "@features/document-verification/model/types";

type Phase = "idle" | "running" | "success";

export function DocumentVerificationFlow() {
  const navigate = useNavigate();
  const vm = useDocumentVerification();

  const [phase, setPhase] = useState<Phase>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlingSubmitRef = useRef(false);
  const mountedRef = useRef(true);
  const [flowKey, setFlowKey] = useState(0);

  // ✅ agora é só frente
  const requiredSides = useMemo(() => ["front"] as DocumentSide[], []);

  function resetFlowUIOnly() {
    setFlowKey((k) => k + 1);
  }

  function start() {
    handlingSubmitRef.current = false;
    setError(null);
    setPhase("running");
    resetFlowUIOnly();
  }

  function stopWithError(message: string) {
    handlingSubmitRef.current = false;
    setLoading(false);
    setError(message);
    setPhase("idle");
  }

  function handleSuccess() {
    setError(null);
    setLoading(false);
    setPhase("success");
    alerts.success({ text: "Documento validado com sucesso!" });
    navigate("/login");
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function submitWithGuards() {
    if (handlingSubmitRef.current) return;
    handlingSubmitRef.current = true;

    setLoading(true);
    setError(null);

    try {
      await vm.submit();

      if (!mountedRef.current) return;

      // Se o hook seta vm.error
      if (vm.error) {
        alerts.warn({ text: vm.error });
        stopWithError(vm.error);
        return;
      }

      // ✅ Ajuste de status: use apenas o domínio do teu VerifyStatus
      if (vm.result?.status === "APPROVED") {
        handleSuccess();
        return;
      }

      if (vm.result?.status === "REJECTED") {
        const msg =
          vm.result?.reasons?.length
            ? `Não foi possível validar: ${vm.result.reasons.join(", ")}`
            : "Não foi possível validar o documento. Tente novamente.";

        alerts.warn({ text: msg });
        stopWithError(msg);
        return;
      }

      // Qualquer outro status (PENDING/PROCESSING/etc)
      alerts.warn({ text: "Não foi possível concluir a validação. Tente novamente." });
      stopWithError("Não foi possível concluir a validação. Tente novamente.");
    } catch (err: unknown) {
      console.error("Erro ao enviar documento:", err);
      if (!mountedRef.current) return;

      const msg =
        err instanceof Error ? err.message : "Falha ao validar o documento. Tente novamente.";

      alerts.warn({ text: msg });
      stopWithError(msg);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        handlingSubmitRef.current = false;
      }
    }
  }

  if (phase === "idle") {
    return (
      <div style={{ maxWidth: 520, margin: "40px auto", textAlign: "center" }}>
        <h2>Validação do Documento</h2>

        {error ? <p style={{ marginTop: 12 }}>{error}</p> : null}

        <button onClick={start} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "Iniciando..." : "Iniciar validação do documento"}
        </button>
      </div>
    );
  }

  return (
    <div key={flowKey} style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 12, padding: 10, background: "#f6f6f6", borderRadius: 8 }}>
        <div><strong>step:</strong> {vm.step}</div>
        <div><strong>documentType:</strong> {vm.documentType ?? "(null)"}</div>
        <div><strong>lado:</strong> frente</div>
      </div>

      {vm.step === "TYPE" ? (
        <DocumentTypeStep onSelect={vm.selectType} />
      ) : null}

      {vm.step === "CAPTURE" && vm.documentType ? (
        <DocumentCaptureStep
          documentType={vm.documentType}
          requiredSides={requiredSides}
          files={vm.files}
          onPickFile={vm.setSideFile}
          onBack={vm.goBack}
          onNext={vm.goToReview}
          canNext={vm.canGoReview}
        />
      ) : null}

      {vm.step === "REVIEW" && vm.documentType ? (
        <ReviewSubmitStep
          documentType={vm.documentType}
          requiredSides={requiredSides}
          files={vm.files}
          loading={loading || vm.loading}
          onBack={vm.goBack}
          onSubmit={submitWithGuards}
        />
      ) : null}

      {vm.step === "RESULT" && vm.result ? (
        <div>
          <h2>Resultado</h2>

          <p><strong>Status:</strong> {vm.result.status}</p>

          {vm.result.reasons?.length ? (
            <>
              <strong>Motivos:</strong>
              <ul>
                {vm.result.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          ) : null}

          {vm.result.extractedFields ? (
            <>
              <strong>Campos extraídos:</strong>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  background: "#f6f6f6",
                  padding: 12,
                  borderRadius: 8,
                }}
              >
                {JSON.stringify(vm.result.extractedFields, null, 2)}
              </pre>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setError(null);
              setPhase("idle");
            }}
            style={{ marginTop: 12 }}
          >
            Voltar
          </button>
        </div>
      ) : null}

      {/* Fallback */}
      {vm.step !== "TYPE" &&
      vm.step !== "CAPTURE" &&
      vm.step !== "REVIEW" &&
      vm.step !== "RESULT" ? (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          Step inválido: {String(vm.step)}
        </div>
      ) : null}
    </div>
  );
}
