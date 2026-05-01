import type { DocumentType } from "../documentoVerification/types";

export function DocumentTypeStep({ onSelect }: { onSelect: (t: DocumentType) => void }) {
  return (
    <div>
      <h2>Selecione o documento</h2>
      <button onClick={() => onSelect("CNH")}>CNH</button>
      <button onClick={() => onSelect("RG")}>RG</button>
    </div>
  );
}
