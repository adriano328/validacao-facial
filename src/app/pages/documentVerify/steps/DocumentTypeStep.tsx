import type { DocumentType } from "../../../../features/documentoVerification/types";

export function DocumentTypeStep(props: { onSelect: (t: DocumentType) => void }) {
  return (
    <div>
      <h2>Selecione o documento</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={() => props.onSelect("CNH")}>CNH</button>
        <button type="button" onClick={() => props.onSelect("RG")}>RG</button>
      </div>

      <p style={{ marginTop: 12 }}>
        Para passaporte, envie a página de dados (onde fica a MRZ).
      </p>
    </div>
  );
}
