import type { MouseEventHandler } from "react";
import { Link } from "react-router-dom";

export type GestaoHubIcon =
  | "fingerprint"
  | "users"
  | "shield"
  | "briefcase"
  | "building"
  | "sliders"
  | "committee"
  | "board"
  | "calendar"
  | "election";

type GestaoHubCardProps = {
  title: string;
  description: string;
  icon: GestaoHubIcon;
  to?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

function GestaoHubCardIcon({ name }: { name: GestaoHubIcon }) {
  const paths: Record<GestaoHubIcon, string> = {
    fingerprint:
      "M12 3c3.4 0 6 2.3 6 5.5h-2C16 6.4 14.3 5 12 5S8 6.4 8 8.5c0 1.2-.2 2.7-.8 4.5l-1.9-.6c.5-1.6.7-2.9.7-3.9C6 5.3 8.6 3 12 3Zm0 4c1.3 0 2 .7 2 1.7 0 3.8-1.2 6.8-3.8 9.6l-1.5-1.3c2.3-2.5 3.3-5 3.3-8.3 0-.1 0-.1-.1-.1-.9 0-1.4.5-1.4 1.4 0 2.4-.8 5-2.1 7.1l-1.7-1c1.1-1.8 1.8-4 1.8-6.1C8.5 8.2 9.9 7 12 7Zm4 2h2c0 4.6-1.4 8-4.3 11l-1.4-1.4C14.8 16 16 13.1 16 9Zm4 .3h2c-.1 4.5-1.6 8.3-4.3 11.2l-1.5-1.4c2.4-2.6 3.7-5.9 3.8-9.8Z",
    users:
      "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm6.5 0a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6ZM9 13c-3.8 0-6 1.9-6 4.1V19h12v-1.9C15 14.9 12.8 13 9 13Zm6.4.1c.9.9 1.6 2.2 1.6 4V19h4v-1.6c0-2-2-3.8-5.6-4.3Z",
    shield:
      "M12 3 5 6v5c0 4.4 2.8 8.3 7 9.8 4.2-1.5 7-5.4 7-9.8V6l-7-3Zm0 2.2 5 2.1V11c0 3.2-1.9 6.2-5 7.5-3.1-1.3-5-4.3-5-7.5V7.3l5-2.1Zm-1 8.5-2-2-1.4 1.4L11 16.5l5.4-5.4L15 9.7l-4 4Z",
    briefcase:
      "M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1h4V5Zm2 1h2V5h-2v1Zm-5 5v7h12v-7h-4v1h-4v-1H6Zm12-2V8H6v1h12Z",
    building:
      "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v12h-7v-4H7v4H4Zm3-6h6v-2H7v2Zm0-4h2V9H7v2Zm4 0h2V9h-2v2Zm-4-4h2V5H7v2Zm4 0h2V5h-2v2Zm5 12h2v-2h-2v2Zm0-4h2v-2h-2v2Zm0-4h2V9h-2v2Z",
    sliders:
      "M5 4h2v10H5V4Zm0 12h2v4H5v-4Zm6-12h2v4h-2V4Zm0 6h2v10h-2V10Zm6-6h2v12h-2V4Zm0 14h2v2h-2v-2ZM3 13h6v2H3v-2Zm6-6h6v2H9V7Zm6 9h6v2h-6v-2Z",
    committee:
      "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm6.5 0a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6ZM9 13c-3.8 0-6 1.9-6 4.1V19h12v-1.9C15 14.9 12.8 13 9 13Zm6.4.1c.9.9 1.6 2.2 1.6 4V19h4v-1.6c0-2-2-3.8-5.6-4.3Z",
    board:
      "M4 4h16v3H4V4Zm1 5h14v11H5V9Zm2 2v7h10v-7H7Zm2 1h2v2H9v-2Zm4 0h2v2h-2v-2Zm-4 3h2v2H9v-2Zm4 0h2v2h-2v-2Z",
    calendar:
      "M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2Zm12 8H5v9h14v-9ZM5 8h14V6H5v2Zm2 4h3v3H7v-3Zm5 0h5v2h-5v-2Zm0 4h4v2h-4v-2Z",
    election:
      "M8 3h8v5h3a1 1 0 0 1 .9.6l2 5A1 1 0 0 1 21 15h-1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5H3a1 1 0 0 1-.9-1.4l2-5A1 1 0 0 1 5 8h3V3Zm2 2v7h4V5h-4Zm-4.3 5-1.2 3h15l-1.2-3H16v4H8v-4H5.7ZM6 15v4h12v-4H6Z",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function GestaoHubCardContent({
  description,
  icon,
  title,
}: Pick<GestaoHubCardProps, "description" | "icon" | "title">) {
  return (
    <>
      <span className="home-quickIcon" aria-hidden="true">
        <GestaoHubCardIcon name={icon} />
      </span>
      <strong>{title}</strong>
      <span>{description}</span>
      <em aria-hidden="true">→</em>
    </>
  );
}

export function GestaoHubCard({
  description,
  icon,
  onClick,
  title,
  to,
}: GestaoHubCardProps) {
  if (to) {
    return (
      <Link className="home-quickCard gestao-card" to={to}>
        <GestaoHubCardContent description={description} icon={icon} title={title} />
      </Link>
    );
  }

  return (
    <button className="home-quickCard gestao-card" type="button" onClick={onClick}>
      <GestaoHubCardContent description={description} icon={icon} title={title} />
    </button>
  );
}
