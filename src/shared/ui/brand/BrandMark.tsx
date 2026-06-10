import "./BrandMark.css";

type BrandMarkProps = {
  className?: string;
  title?: string;
  subtitle?: string;
};

const DEFAULT_TITLE = "E-Voto";
const DEFAULT_SUBTITLE = "Plataforma de Voto Eletrônico COMADEMAT";

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.2 5.5 6v5.1c0 4.1 2.7 7.9 6.5 9.2 3.8-1.3 6.5-5.1 6.5-9.2V6L12 3.2Zm0 2.4 4.4 1.9v3.6c0 3-1.7 5.8-4.4 7-2.7-1.2-4.4-4-4.4-7V7.5L12 5.6Z" />
      <path d="M10.7 13.6 8.6 11.5l-1.2 1.2 3.3 3.3 5.8-5.8-1.2-1.2-4.6 4.6Z" />
    </svg>
  );
}

export function BrandMark({
  className = "",
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
}: BrandMarkProps) {
  return (
    <header className={`brandMark ${className}`.trim()}>
      <span className="brandMark-icon" aria-hidden="true">
        <ShieldIcon />
      </span>
      <h1 className="brandMark-title">{title}</h1>
      {subtitle ? <p className="brandMark-subtitle">{subtitle}</p> : null}
    </header>
  );
}
