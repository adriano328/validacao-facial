import logoUrl from "@shared/assets/comademat-logo.png";
import "./BrandMark.css";

type BrandMarkProps = {
  className?: string;
  title?: string;
  subtitle?: string;
};

const DEFAULT_TITLE = "Portal de Eleições COMADEMAT";
const DEFAULT_SUBTITLE = "Acesso Institucional Restrito";

export function BrandMark({
  className = "",
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
}: BrandMarkProps) {
  return (
    <header className={`brandMark ${className}`.trim()}>
      <img className="brandMark-logo" src={logoUrl} alt="COMADEMAT" />
      <h1 className="brandMark-title">{title}</h1>
      {subtitle ? <p className="brandMark-subtitle">{subtitle}</p> : null}
    </header>
  );
}
