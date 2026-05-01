import { useMemo, useState } from "react";
import type { DocumentType } from "../../../features/documentoVerification/types";
import { DocumentCameraCapture } from "./steps/DocumentCameraCapture";

type Props = {
  label?: string;
  required?: boolean;
  documentType: DocumentType;
  value: string;                 // base64
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
  label = "Foto do documento (frente)",
  required = true,
  documentType,
  value,
  onChange,
  disabled,
  error,
}: Props) {
  const [openCam, setOpenCam] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);

  const hasValue = !!value;
  const previewSrc = useMemo(() => (hasValue ? value : ""), [hasValue, value]);

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <strong>
          {label} {required && <span style={{ color: "#c00" }}>*</span>}
        </strong>
        <span style={styles.badge(hasValue ? "ok" : "warn")}>
          {hasValue ? "Ok" : "Obrigatório"}
        </span>
      </div>

      <div style={styles.body}>
        {!hasValue ? (
          <div style={styles.empty}>
            <p style={{ fontSize: 13, opacity: 0.8 }}>
              Tire uma foto nítida da frente do {documentType}. Evite reflexos.
            </p>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpenCam(true)}
              style={styles.primaryBtn(disabled)}
            >
              Tirar foto
            </button>
          </div>
        ) : (
          <div style={styles.filled}>
            <button
              type="button"
              onClick={() => setOpenPreview(true)}
              style={styles.previewBtn}
            >
              <img src={previewSrc} alt="document-preview" style={styles.previewImg} />
              <span style={styles.previewHint}>Toque para ampliar</span>
            </button>

            <div style={styles.actionsRow}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setOpenCam(true)}
                style={styles.secondaryBtn(disabled)}
              >
                Tirar novamente
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange("")}
                style={styles.dangerBtn(disabled)}
              >
                Remover
              </button>
            </div>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}
      </div>

      <DocumentCameraCapture
        open={openCam}
        documentType={documentType}
        onClose={() => setOpenCam(false)}
        onCapture={async (file) => {
          const base64 = await fileToBase64(file);
          onChange(base64);        // ✅ salva base64 no form
        }}
      />

      {openPreview && hasValue && (
        <div style={styles.previewBackdrop} onClick={() => setOpenPreview(false)}>
          <div style={styles.previewModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.previewTop}>
              <strong>Pré-visualização</strong>
              <button type="button" onClick={() => setOpenPreview(false)} style={styles.closeBtn}>
                Fechar
              </button>
            </div>
            <img src={previewSrc} alt="preview-large" style={styles.previewLarge} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, any> = {
  wrap: { border: "1px solid #ddd", borderRadius: 10, background: "#fff" },
  header: { padding: 12, display: "flex", justifyContent: "space-between", background: "#f6f6f6" },
  badge: (kind: "ok" | "warn") => ({
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    background: kind === "ok" ? "#dcfce7" : "#fee2e2",
    border: "1px solid",
    borderColor: kind === "ok" ? "#86efac" : "#fca5a5",
    fontWeight: 600,
  }),
  body: { padding: 12 },
  empty: { display: "flex", flexDirection: "column", gap: 10 },
  filled: { display: "flex", flexDirection: "column", gap: 10 },
  actionsRow: { display: "flex", gap: 10, flexWrap: "wrap" },

  primaryBtn: (d?: boolean) => ({
    padding: "10px 14px",
    borderRadius: 10,
    background: "#2563eb",
    color: "#fff",
    border: "1px solid #2563eb",
    cursor: d ? "not-allowed" : "pointer",
    opacity: d ? 0.6 : 1,
  }),
  secondaryBtn: (d?: boolean) => ({
    padding: "10px 14px",
    borderRadius: 10,
    background: "#fff",
    border: "1px solid #ddd",
    cursor: d ? "not-allowed" : "pointer",
    opacity: d ? 0.6 : 1,
  }),
  dangerBtn: (d?: boolean) => ({
    padding: "10px 14px",
    borderRadius: 10,
    background: "#fff",
    border: "1px solid #fca5a5",
    color: "#b91c1c",
    cursor: d ? "not-allowed" : "pointer",
    opacity: d ? 0.6 : 1,
  }),

  previewBtn: { width: "100%", borderRadius: 10, overflow: "hidden", background: "#000", position: "relative" },
  previewImg: { width: "100%", maxHeight: 220, objectFit: "cover" },
  previewHint: { position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.55)", color: "#fff", padding: "4px 8px", borderRadius: 8, fontSize: 12 },

  error: { marginTop: 8, color: "#b91c1c", fontSize: 13 },

  previewBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "grid", placeItems: "center", zIndex: 9999 },
  previewModal: { width: "min(920px, 96vw)", background: "#111", borderRadius: 12 },
  previewTop: { display: "flex", justifyContent: "space-between", padding: 12, color: "#fff", background: "#000" },
  closeBtn: { background: "transparent", border: "1px solid #333", color: "#fff", padding: "6px 10px", borderRadius: 8 },
  previewLarge: { width: "100%", objectFit: "contain", background: "#000" },
};
