import { useCallback, useMemo, useState } from "react";
import type { DocumentType, DocumentSide } from "./types";
import type { VerifyResponse } from "./types";
import { criarPresignedUpload, uploadDocumentoS3, verificarDocumento } from "../../services/docverification";

type Step = "TYPE" | "CAPTURE" | "REVIEW" | "RESULT";

const requiredSidesByType: Record<DocumentType, DocumentSide[]> = {
  CNH: ["front", "back"],
  RG: ["front", "back"],
};

export function useDocumentVerification(livenessSessionId: string) {
  const [step, setStep] = useState<Step>("TYPE");
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);

  const [files, setFiles] = useState<Partial<Record<DocumentSide, File>>>({});
  const [s3Keys, setS3Keys] = useState<Partial<Record<DocumentSide, string>>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const requiredSides = useMemo<DocumentSide[]>(() => {
    return documentType ? requiredSidesByType[documentType] : [];
  }, [documentType]);

  const canGoReview = useMemo(() => {
    return requiredSides.every((side) => Boolean(files[side]));
  }, [requiredSides, files]);

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
    if (canGoReview) setStep("REVIEW");
  }, [canGoReview]);

  const goBack = useCallback(() => {
    setError(null);

    if (step === "CAPTURE") setStep("TYPE");
    else if (step === "REVIEW") setStep("CAPTURE");
    else if (step === "RESULT") setStep("REVIEW");
  }, [step]);

  const submit = useCallback(async () => {
    if (!documentType) {
      setError("Tipo de documento não selecionado.");
      return;
    }
    if (!livenessSessionId) {
      setError("livenessSessionId não informado.");
      return;
    }
    if (!requiredSides.every((side) => files[side])) {
      setError("Envie todas as imagens necessárias.");
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();

    try {
      const nextS3Keys: Partial<Record<DocumentSide, string>> = {};

      // 1) Presign + upload para cada lado
      for (const side of requiredSides) {
        const file = files[side]!;
        const presign = await criarPresignedUpload(
          { documentType, side, mimeType: file.type },
          controller.signal
        );

        await uploadDocumentoS3(presign.uploadUrl, file, controller.signal);
        nextS3Keys[side] = presign.s3Key;
      }

      setS3Keys(nextS3Keys);

      // 2) Verificação (OCR + faceMatch via liveness)
      const verify = await verificarDocumento(
        { documentType, livenessSessionId, s3Keys: nextS3Keys },
        controller.signal
      );

      setResult(verify);
      setStep("RESULT");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, [documentType, livenessSessionId, requiredSides, files]);

  return {
    step,
    documentType,
    requiredSides,
    files,
    s3Keys,

    loading,
    error,
    result,

    selectType,
    setSideFile,
    goToReview,
    goBack,
    submit,

    canGoReview,
  };
}
