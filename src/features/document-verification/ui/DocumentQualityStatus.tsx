import type { DocumentQualityResult } from "@features/document-verification/types/documentQuality";
import "./DocumentQualityStatus.css";

type Props = {
  quality: DocumentQualityResult;
  loading: boolean;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function statusClass(ok: boolean) {
  return ok ? "is-ok" : "is-warning";
}

export function DocumentQualityStatus({ quality, loading }: Props) {
  return (
    <div className={`documentQualityStatus ${quality.valid ? "is-valid" : "is-invalid"}`}>
      <strong>{loading ? "Carregando validação do documento..." : quality.message}</strong>

      <div className="documentQualityStatus-metrics" aria-label="Qualidade do documento">
        <span className={statusClass(quality.coverageValid)}>
          Enquadramento {formatPercent(quality.coverage)}
        </span>
        <span className={statusClass(quality.sharpnessValid)}>
          Nitidez {Math.round(quality.sharpness)}
        </span>
        <span className={statusClass(quality.brightnessValid)}>
          Luz {Math.round(quality.brightness)}
        </span>
        <span className={statusClass(quality.glareValid)}>
          Reflexo {formatPercent(quality.glare)}
        </span>
        <span className={statusClass(quality.stable)}>
          {quality.stable ? "Estável" : "Ajustando"}
        </span>
      </div>
    </div>
  );
}
