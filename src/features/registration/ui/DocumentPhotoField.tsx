import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { DocumentType } from "@features/document-verification/model/types";
import { DocumentCameraCapture } from "@features/document-verification/ui/steps/DocumentCameraCapture";
import { getDocumentFileLabel, isPdfDocument } from "@shared/utils/documentMedia";
import "./FacePhotoField.css";

type Props = {
  label?: string;
  required?: boolean;
  documentType: DocumentType;
  value: string;
  onChange: (base64: string) => void;
  disabled?: boolean;
  error?: string | null;
};

const PDF_MIME_TYPE = "application/pdf";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao converter imagem"));
    reader.readAsDataURL(file);
  });
}

function isPdfFile(file: File) {
  return file.type === PDF_MIME_TYPE || file.name.toLowerCase().endsWith(".pdf");
}

export function DocumentPhotoField({
  label = "Foto do documento",
  required = true,
  documentType,
  value,
  onChange,
  disabled,
  error,
}: Props) {
  const [openCam, setOpenCam] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const hasValue = value.trim().length > 0;
  const hasPdfValue = isPdfDocument(value);
  const hasImageValue = hasValue && !hasPdfValue;

  function clearPdfSelection() {
    setPdfFileName(null);
    setPdfError(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  }

  async function handlePdfChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    if (!isPdfFile(file)) {
      setPdfFileName(null);
      setPdfError("Arquivo não suportado. Selecione um PDF.");
      event.currentTarget.value = "";
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setPdfFileName(file.name);
      setPdfError(null);
      onChange(base64);
    } catch {
      setPdfFileName(null);
      setPdfError("Não foi possível ler o PDF selecionado.");
      event.currentTarget.value = "";
    }
  }

  return (
    <section className="facePhoto documentPhotoField" aria-label={label}>
      <div className="facePhoto-preview documentPhotoField-preview">
        {hasImageValue ? (
          <img
            className="facePhoto-image documentPhotoField-image"
            src={value}
            alt="Documento capturado"
          />
        ) : hasPdfValue ? (
          <div className="documentPhotoField-pdfPreview">
            <span aria-hidden="true">PDF</span>
            <strong>{pdfFileName ?? getDocumentFileLabel(value)}</strong>
          </div>
        ) : (
          <div className="facePhoto-empty" aria-hidden="true">
            <span className="facePhoto-emptyIcon">+</span>
          </div>
        )}
      </div>

      <div className="facePhoto-content">
        <div className="facePhoto-heading">
          <h3>
            {label}
            {required ? <span aria-hidden="true"> *</span> : null}
          </h3>
          <span className={`facePhoto-status ${hasValue ? "is-ok" : "is-pending"}`}>
            {hasValue ? "Ok" : "Obrigatorio"}
          </span>
        </div>

        <p>Tire uma foto nitida do documento inteiro ou importe um PDF do documento.</p>

        <div className="facePhoto-actions documentPhotoField-actions">
          <button
            className="vf-button vf-button--primary facePhoto-button"
            type="button"
            disabled={disabled}
            onClick={() => setOpenCam(true)}
          >
            {hasImageValue ? "Tirar novamente" : "Tirar foto"}
          </button>

          <span className="documentPhotoField-separator">ou</span>

          <button
            className="vf-button vf-button--secondary facePhoto-button"
            type="button"
            disabled={disabled}
            onClick={() => pdfInputRef.current?.click()}
          >
            Importar PDF
          </button>

          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            disabled={disabled}
            onChange={handlePdfChange}
          />

          {hasValue ? (
            <button
              className="vf-button vf-button--secondary facePhoto-button"
              type="button"
              disabled={disabled}
              onClick={() => {
                clearPdfSelection();
                onChange("");
              }}
            >
              Remover
            </button>
          ) : null}
        </div>

        {hasPdfValue ? (
          <div className="documentPhotoField-pdfInfo">
            <div>
              <strong>PDF selecionado:</strong> {pdfFileName ?? getDocumentFileLabel(value)}
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                clearPdfSelection();
                onChange("");
              }}
            >
              Remover PDF
            </button>
          </div>
        ) : null}

        {pdfError ? <span className="facePhoto-error">{pdfError}</span> : null}

        {error ? <span className="facePhoto-error">{error}</span> : null}
      </div>

      <DocumentCameraCapture
        open={openCam}
        documentType={documentType}
        onClose={() => setOpenCam(false)}
        onCapture={async (file) => {
          const base64 = await fileToBase64(file);
          clearPdfSelection();
          onChange(base64);
        }}
      />
    </section>
  );
}
