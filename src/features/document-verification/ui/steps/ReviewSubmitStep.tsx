import { useEffect, useMemo } from "react";
import type {
  DocumentType,
  DocumentSide,
} from "@features/document-verification/model/types";

function sideTitle(side: DocumentSide) {
  return side === "front" ? "Frente" : "Verso";
}

export function ReviewSubmitStep(props: {
  documentType: DocumentType;
  requiredSides: DocumentSide[];
  files: Partial<Record<DocumentSide, File>>;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const previews = useMemo(() => {
    const urls: Partial<Record<DocumentSide, string>> = {};
    for (const side of props.requiredSides) {
      const f = props.files[side];
      if (f) urls[side] = URL.createObjectURL(f);
    }
    return urls;
  }, [props.files, props.requiredSides]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [previews]);

  return (
    <div>
      <h2>Revisar</h2>
      <p>Confira se as imagens estão nítidas e sem cortes.</p>

      <div style={{ display: "grid", gap: 16 }}>
        {props.requiredSides.map((side) => (
          <div key={side} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
            <strong>{sideTitle(side)}</strong>
            {previews[side] ? (
              <img
                src={previews[side]}
                alt={`review-${side}`}
                style={{ marginTop: 10, width: "100%", maxWidth: 480, borderRadius: 8 }}
              />
            ) : (
              <p style={{ marginTop: 10, color: "#666" }}>Imagem ausente.</p>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button type="button" onClick={props.onBack} disabled={props.loading}>Voltar</button>
        <button type="button" onClick={props.onSubmit} disabled={props.loading}>
          {props.loading ? "Validando..." : "Enviar e validar"}
        </button>
      </div>
    </div>
  );
}
