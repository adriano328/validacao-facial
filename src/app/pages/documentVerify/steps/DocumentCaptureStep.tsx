import type { DocumentSide, DocumentType } from "../../../../features/documentoVerification/types";

import { DocumentImagePicker } from "./DocumentImagePicker";

function sideTitle(side: DocumentSide) {
  return side === "front" ? "Frente" : "Verso"; 
}

type Props = {
  documentType: DocumentType;
  requiredSides: DocumentSide[];
  files: Partial<Record<DocumentSide, File>>;
  onPickFile: (side: DocumentSide, file: File) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
};

export function DocumentCaptureStep({
  documentType,
  requiredSides,
  files,
  onPickFile,
  onBack,
  onNext,
  canNext,
}: Props) {
  return (
    <div>
      <h2>Envio do documento ({documentType})</h2>

      <div style={{ display: "grid", gap: 16 }}>
        {requiredSides.map((side) => (
          <div key={side}>
            <DocumentImagePicker
              side={side}
              label={sideTitle(side)}
              onPick={(file) => onPickFile(side, file)}
            />

            {files[side] ? (
              <p style={{ marginTop: 8, color: "green" }}>Imagem adicionada</p>
            ) : (
              <p style={{ marginTop: 8, color: "#666" }}>Nenhuma imagem enviada</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button type="button" onClick={onBack}>
          Voltar
        </button>
        <button type="button" onClick={onNext} disabled={!canNext}>
          Revisar
        </button>
      </div>
    </div>
  );
}
