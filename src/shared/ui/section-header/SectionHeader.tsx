import "./SectionHeader.css";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  id?: string;
  className?: string;
  titleAs?: "h2" | "h3" | "h4";
};

export function SectionHeader({
  title,
  subtitle,
  id,
  className,
  titleAs = "h2",
}: SectionHeaderProps) {
  const TitleTag = titleAs;
  const classes = ["vf-sectionHeader", "sectionHeader", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <TitleTag className="vf-title sectionHeader-title" id={id}>
        {title}
      </TitleTag>
      {subtitle ? (
        <p className="vf-text sectionHeader-subtitle">{subtitle}</p>
      ) : null}
    </div>
  );
}
