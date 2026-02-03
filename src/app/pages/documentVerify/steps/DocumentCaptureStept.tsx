import { useMemo } from "react";
import type { DocumentType, DocumentSide } from "../../../../features/documentoVerification/types";


function labelForSide(type: DocumentType, side: DocumentSide) {
  if (side === "front") return "Frente";
  if (side === "back") return "Verso";
  return side;
}

function acceptForImages() {
  return "image/*";
}

export function DocumentCaptureStep(props: {
  documentType: DocumentType;
  requiredSides: DocumentSide[];
  files: Partial<Record<DocumentSide, File>>;
  onPickFile: (side: DocumentSide, file: File) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  const previews = useMemo(() => {
    const urls: Partial<Record<DocumentSide, string>> = {};
    for (const side of props.requiredSides) {
      const f = props.files[side];
      if (f) urls[side] = URL.createObjectURL(f);
    }
    return urls;
  }, [props.files, props.requiredSides]);

  return (
    <div>
      <h2>Capture as imagens</h2>
      <p>
        Dica: boa iluminação, sem reflexo e documento preenchendo o quadro.
      </p>

      <div style={{ display: "grid", gap: 16 }}>
        {props.requiredSides.map((side) => (
          <div key={side} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <strong>{labelForSide(props.documentType, side)}</strong>

              <label style={{ display: "inline-block" }}>
                <input
                  type="file"
                  accept={acceptForImages()}
                  // Em mobile, isso abre a câmera. Em desktop, abre o seletor.
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) props.onPickFile(side, file);
                    e.currentTarget.value = "";
                  }}
                />
                <span style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}>
                  Enviar foto
                </span>
              </label>
            </div>

            {previews[side] ? (
              <img
                src={previews[side]}
                alt={`preview-${side}`}
                style={{ marginTop: 10, width: "100%", maxWidth: 480, borderRadius: 8 }}
              />
            ) : (
              <p style={{ marginTop: 10, color: "#666" }}>Nenhuma imagem enviada.</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button type="button" onClick={props.onBack}>Voltar</button>
        <button type="button" onClick={props.onNext} disabled={!props.canNext}>
          Revisar
        </button>
      </div>
    </div>
  );
}
