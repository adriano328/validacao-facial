import type { DocumentSide, DocumentType } from "../../../../features/documentoVerification/types";
import { DocumentImagePicker } from "./DocumentImagePicker";

function title(side: DocumentSide) {
  return side === "front" ? "Frente" : "Verso";
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
  return (
    <div>
      <h2>Captura do documento</h2>

      {props.requiredSides.map((side) => (
        <DocumentImagePicker
          key={side}
          side={side}
          label={title(side)}
          documentType={props.documentType}
          onPick={(file) => props.onPickFile(side, file)}
        />
      ))}

      <button onClick={props.onBack}>Voltar</button>
      <button disabled={!props.canNext} onClick={props.onNext}>Revisar</button>
    </div>
  );
}
