import React, { useMemo, useRef, useState } from "react";
import type { DocumentSide } from "../../../../features/documentoVerification/types";
import { CameraCapture } from "./CameraCapture";

type Props = {
  side: DocumentSide;
  label: string;
  disabled?: boolean;
  onPick: (file: File) => void;
};

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function DocumentImagePicker({ label, disabled, onPick }: Props) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const mobile = useMemo(() => isMobile(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPick(file);
    e.currentTarget.value = "";
  }

  function handleTakePhoto() {
    if (disabled) return;

    // Mobile: usar input com capture (abre câmera do celular)
    if (mobile) {
      mobileCameraInputRef.current?.click();
      return;
    }

    // Desktop: abrir modal WebRTC
    setCameraOpen(true);
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <strong>{label}</strong>

      {/* Mobile camera input */}
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        onChange={handleChange}
      />

      {/* File picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={disabled}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        onChange={handleChange}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <button type="button" disabled={disabled} onClick={handleTakePhoto}>
          Tirar foto
        </button>

        <button type="button" disabled={disabled} onClick={() => fileInputRef.current?.click()}>
          Enviar arquivo
        </button>
      </div>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={onPick}
      />
    </div>
  );
}
