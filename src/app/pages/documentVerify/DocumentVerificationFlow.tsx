import React from "react";
import { useDocumentVerification } from "../../../features/documentoVerification/useDocumentVerification";
import { DocumentTypeStep } from "./steps/DocumentTypeStep";
import { DocumentCaptureStep } from "./steps/DocumentCaptureStep";
import { ReviewSubmitStep } from "./steps/ReviewSubmitStep";

export function DocumentVerificationFlow() {
  // depois você troca por liveness real via props/rota
  const vm = useDocumentVerification("123");

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Debug rápido para não ficar branco nunca (remove depois) */}
      <div style={{ marginBottom: 12, padding: 10, background: "#f6f6f6", borderRadius: 8 }}>
        <div><strong>step:</strong> {vm.step}</div>
        <div><strong>documentType:</strong> {vm.documentType ?? "(null)"}</div>
      </div>

      {vm.error ? (
        <div
          style={{
            background: "#ffe6e6",
            border: "1px solid #ffb3b3",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {vm.error}
        </div>
      ) : null}

      {vm.step === "TYPE" ? <DocumentTypeStep onSelect={vm.selectType} /> : null}

      {vm.step === "CAPTURE" && vm.documentType ? (
        <DocumentCaptureStep
          documentType={vm.documentType}
          requiredSides={vm.requiredSides}
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
          requiredSides={vm.requiredSides}
          files={vm.files}
          loading={vm.loading}
          onBack={vm.goBack}
          onSubmit={vm.submit}
        />
      ) : null}

      {vm.step === "RESULT" && vm.result ? (
        <div>
          <h2>Resultado</h2>

          <p>
            <strong>Status:</strong> {vm.result.status}
          </p>

          {vm.result.similarity != null ? (
            <p>
              <strong>Similaridade (doc↔selfie):</strong> {vm.result.similarity}
            </p>
          ) : null}

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

          <button type="button" onClick={vm.goBack} style={{ marginTop: 12 }}>
            Voltar
          </button>
        </div>
      ) : null}
    </div>
  );
}
