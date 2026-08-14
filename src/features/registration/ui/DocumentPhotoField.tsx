import { useState } from "react";
import type { DocumentType } from "@features/document-verification/model/types";
import { DocumentCameraCapture } from "@features/document-verification/ui/steps/DocumentCameraCapture";
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao converter imagem"));
    reader.readAsDataURL(file);
  });
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
  const hasValue = value.trim().length > 0;

  return (
    <section className="facePhoto documentPhotoField" aria-label={label}>
      <div className="facePhoto-preview documentPhotoField-preview">
        {hasValue ? (
          <img
            className="facePhoto-image documentPhotoField-image"
            src={value}
            alt="Documento capturado"
          />
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

        <p>Tire uma foto nitida do documento inteiro. Evite reflexos e cortes.</p>

        <div className="facePhoto-actions">
          <button
            className="vf-button vf-button--primary facePhoto-button"
            type="button"
            disabled={disabled}
            onClick={() => setOpenCam(true)}
          >
            {hasValue ? "Tirar novamente" : "Tirar foto"}
          </button>

          {hasValue ? (
            <button
              className="vf-button vf-button--secondary facePhoto-button"
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
            >
              Remover
            </button>
          ) : null}
        </div>

        {error ? <span className="facePhoto-error">{error}</span> : null}
      </div>

      <DocumentCameraCapture
        open={openCam}
        documentType={documentType}
        onClose={() => setOpenCam(false)}
        onCapture={async (file) => {
          const base64 = await fileToBase64(file);
          onChange(base64);
        }}
      />
    </section>
  );
}
