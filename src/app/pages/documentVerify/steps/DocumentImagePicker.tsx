import React, { useId } from "react";
import type { DocumentSide } from "../../../../features/documentoVerification/types";


type Props = {
  side: DocumentSide;
  label: string;
  disabled?: boolean;
  onPick: (file: File) => void;
};

export function DocumentImagePicker({ side, label, disabled, onPick }: Props) {
  const baseId = useId();
  const cameraId = `${baseId}-${side}-camera`;
  const fileId = `${baseId}-${side}-file`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onPick(file);
    // permite selecionar o mesmo arquivo novamente
    e.currentTarget.value = "";
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
      <strong>{label}</strong>

      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        {/* Botão: Tirar foto (abre câmera no mobile) */}
        <label htmlFor={cameraId} style={{ cursor: disabled ? "not-allowed" : "pointer" }}>
          <input
            id={cameraId}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={disabled}
            style={{ display: "none" }}
            onChange={handleChange}
          />
          <span
            style={{
              padding: "6px 10px",
              border: "1px solid #ccc",
              borderRadius: 6,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Tirar foto
          </span>
        </label>

        {/* Botão: Escolher arquivo (galeria/arquivos) */}
        <label htmlFor={fileId} style={{ cursor: disabled ? "not-allowed" : "pointer" }}>
          <input
            id={fileId}
            type="file"
            accept="image/*"
            disabled={disabled}
            style={{ display: "none" }}
            onChange={handleChange}
          />
          <span
            style={{
              padding: "6px 10px",
              border: "1px solid #ccc",
              borderRadius: 6,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            Enviar arquivo
          </span>
        </label>
      </div>
    </div>
  );
}
