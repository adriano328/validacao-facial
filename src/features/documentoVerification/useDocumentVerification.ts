import { useCallback, useMemo, useState } from "react";
import { criarPresignedUpload, uploadDocumentoS3, verificarDocumento } from "../../services/docverification";
import type { DocumentSide, DocumentType, VerifyResponse } from "./types";

type Step = "TYPE" | "CAPTURE" | "REVIEW" | "RESULT";

const requiredSidesByType: Record<DocumentType, DocumentSide[]> = {
  CNH: ["front", "back"],
  RG: ["front", "back"],
};

export function useDocumentVerification(livenessSessionId: string) {
  const [step, setStep] = useState<Step>("TYPE");
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);

  // Guardamos os arquivos localmente para preview/review
  const [files, setFiles] = useState<Partial<Record<DocumentSide, File>>>({});
  // Guardamos as chaves do S3 após upload
  const [s3Keys, setS3Keys] = useState<Partial<Record<DocumentSide, string>>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const requiredSides = useMemo(() => {
    if (!documentType) return [];
    return requiredSidesByType[documentType];
  }, [documentType]);

  const canGoCapture = !!documentType;
  const canGoReview = requiredSides.every((s) => !!files[s]);

  const selectType = useCallback((type: DocumentType) => {
    setDocumentType(type);
    setFiles({});
    setS3Keys({});
    setResult(null);
    setError(null);
    setStep("CAPTURE");
  }, []);

  const setSideFile = useCallback((side: DocumentSide, file: File) => {
    setFiles((prev) => ({ ...prev, [side]: file }));
    setError(null);
  }, []);

  const goToReview = useCallback(() => {
    if (!canGoReview) return;
    setStep("REVIEW");
  }, [canGoReview]);

  const goBack = useCallback(() => {
    setError(null);
    if (step === "CAPTURE") setStep("TYPE");
    else if (step === "REVIEW") setStep("CAPTURE");
    else if (step === "RESULT") setStep("REVIEW");
  }, [step]);

  const submit = useCallback(async () => {
    if (!documentType) return;
    if (!livenessSessionId) {
      setError("livenessSessionId não informado.");
      return;
    }
    if (!requiredSides.every((s) => files[s])) {
      setError("Envie todas as imagens necessárias.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1) Para cada lado requerido, cria presign e faz upload
      const nextS3Keys: Partial<Record<DocumentSide, string>> = {};

      for (const side of requiredSides) {
        const file = files[side]!;
        const presign = await criarPresignedUpload({
          documentType,
          side,
          mimeType: file.type,
        });

        await uploadDocumentoS3(presign.uploadUrl, file);
        nextS3Keys[side] = presign.s3Key;
      }

      setS3Keys(nextS3Keys);

      // 2) Chama verificação (OCR + MRZ + face match via reference image do liveness)
      const verify = await verificarDocumento({
        documentType,
        livenessSessionId,
        s3Keys: nextS3Keys,
      });

      setResult(verify);
      setStep("RESULT");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, [documentType, files, livenessSessionId, requiredSides]);

  return {
    step,
    documentType,
    requiredSides,
    files,
    s3Keys,
    loading,
    error,
    result,

    // actions
    selectType,
    setSideFile,
    goToReview,
    goBack,
    submit,

    canGoCapture,
    canGoReview,
  };
}
