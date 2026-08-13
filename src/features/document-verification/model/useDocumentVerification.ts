import { useCallback, useMemo, useState } from "react";
import type { DocumentType, DocumentSide, VerifyResponse } from "./types";
import {
  criarPresignedUpload,
  uploadDocumentoS3,
  verificarDocumento,
} from "@features/document-verification/api/documentVerificationApi";

type Step = "TYPE" | "CAPTURE" | "REVIEW" | "RESULT";

const requiredSidesByType: Record<DocumentType, DocumentSide[]> = {
  CNH: ["front", "back"],
  RG: ["front", "back"],
};

export function useDocumentVerification() {
  const [step, setStep] = useState<Step>("TYPE");
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);

  const [files, setFiles] = useState<Partial<Record<DocumentSide, File>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const requiredSides = useMemo(
    () => (documentType ? requiredSidesByType[documentType] : []),
    [documentType]
  );

  const canGoReview = useMemo(
    () => requiredSides.every((s) => !!files[s]),
    [requiredSides, files]
  );

  const selectType = useCallback((type: DocumentType) => {
    setDocumentType(type);
    setFiles({});
    setResult(null);
    setError(null);
    setStep("CAPTURE");
  }, []);

  const setSideFile = useCallback((side: DocumentSide, file: File) => {
    setFiles((prev) => ({ ...prev, [side]: file }));
  }, []);

  const goBack = useCallback(() => {
    if (step === "CAPTURE") setStep("TYPE");
    else if (step === "REVIEW") setStep("CAPTURE");
    else if (step === "RESULT") setStep("REVIEW");
  }, [step]);

  const goToReview = useCallback(() => {
    if (canGoReview) setStep("REVIEW");
  }, [canGoReview]);

  const submit = useCallback(async () => {
    if (!documentType) return;

    try {
      setLoading(true);
      setError(null);

      const s3Keys: Partial<Record<DocumentSide, string>> = {};

      for (const side of requiredSides) {
        const file = files[side]!;
        const presign = await criarPresignedUpload({
          documentType,
          side,
          mimeType: file.type,
        });

        await uploadDocumentoS3(presign.uploadUrl, file);
        s3Keys[side] = presign.s3Key;
      }

      const res = await verificarDocumento({
        documentType,
        s3Keys,
      });

      setResult(res);
      setStep("RESULT");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }, [documentType, files, requiredSides]);

  return {
    step,
    documentType,
    requiredSides,
    files,
    loading,
    error,
    result,

    selectType,
    setSideFile,
    goBack,
    goToReview,
    submit,
    canGoReview,
  };
}
