import React, { useRef, useState } from "react";
import type { DocumentType, DocumentSide } from "../../../../features/documentoVerification/types";
import { DocumentCameraCapture } from "./DocumentCameraCapture";

type Props = {
  side: DocumentSide;
  label: string;
  documentType: DocumentType;
  disabled?: boolean;
  onPick: (file: File) => void;
};

export function DocumentImagePicker({ label, documentType, disabled, onPick }: Props) {
  const [openCam, setOpenCam] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPick(file);
    e.currentTarget.value = "";
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <strong>{label}</strong>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={disabled}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        onChange={handleFile}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button type="button" disabled={disabled} onClick={() => setOpenCam(true)}>
          Tirar foto
        </button>
        <button type="button" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
          Enviar arquivo
        </button>
      </div>

      <DocumentCameraCapture
        open={openCam}
        documentType={documentType}
        onClose={() => setOpenCam(false)}
        onCapture={onPick}
      />
    </div>
  );
}
