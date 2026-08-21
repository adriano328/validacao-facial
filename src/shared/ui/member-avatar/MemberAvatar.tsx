import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import "./MemberAvatar.css";

type MemberAvatarSize = "xs" | "sm" | "md" | "lg";
type MemberAvatarShape = "circle" | "rounded";
type MemberAvatarFit = "cover" | "contain";

type MemberAvatarProps = {
  src?: string | null;
  alt?: string;
  size?: MemberAvatarSize | number | string;
  className?: string;
  fallback?: string | null;
  shape?: MemberAvatarShape;
  fit?: MemberAvatarFit;

  /**
   * Define o ponto de enquadramento da foto.
   *
   * Exemplos:
   * "center center"
   * "center 55%"
   * "center 58%"
   */
  objectPosition?: string;

  /**
   * Escala interna da fotografia.
   *
   * 1    = ocupa 100% do avatar
   * 0.94 = pequeno afastamento
   * 0.92 = afastamento recomendado
   * 0.90 = afastamento maior
   */
  imageScale?: number;
};

function getImageSrc(value?: string | null): string | null {
  const photo = (value ?? "").trim();

  if (!photo) {
    return null;
  }

  // Base64 já formatado.
  if (photo.startsWith("data:image/")) {
    return photo;
  }

  // URL HTTP/HTTPS.
  if (/^https?:\/\//i.test(photo)) {
    return photo;
  }

  // Blob gerado no navegador.
  if (photo.startsWith("blob:")) {
    return photo;
  }

  // Caminho absoluto/relativo já utilizável pelo navegador.
  if (
    photo.startsWith("/") ||
    photo.startsWith("./") ||
    photo.startsWith("../")
  ) {
    return photo;
  }

  // Caso padrão da aplicação: Base64 puro.
  return `data:image/jpeg;base64,${photo}`;
}

function getFallback(text?: string | null): string {
  const parts = (text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const firstInitial = parts[0]?.[0] ?? "";
  const lastInitial = parts[parts.length - 1]?.[0] ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function isPresetAvatarSize(
  size: MemberAvatarSize | number | string,
): size is MemberAvatarSize {
  return (
    typeof size === "string" &&
    ["xs", "sm", "md", "lg"].includes(size)
  );
}

export function MemberAvatar({
  src,
  alt = "",
  size = "xs",
  className,
  fallback,
  shape = "circle",
  fit = "cover",
  objectPosition = "center 58%",
  imageScale = 0.92,
}: MemberAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageSrc = getImageSrc(src);
  const isPresetSize = isPresetAvatarSize(size);

  useEffect(() => {
    setImageFailed(false);
  }, [imageSrc]);

  const normalizedScale = Math.min(
    1,
    Math.max(0.75, imageScale),
  );

  const style = {
    ...(!isPresetSize
      ? {
          "--member-avatar-size":
            typeof size === "number"
              ? `${size}px`
              : size,
        }
      : {}),

    "--member-avatar-object-position": objectPosition,
    "--member-avatar-image-scale": normalizedScale,
  } as CSSProperties;

  const hasImage = Boolean(imageSrc && !imageFailed);

  return (
    <span
      className={[
        "memberAvatar",
        `memberAvatar--${shape}`,
        isPresetSize
          ? `memberAvatar--${size}`
          : null,
        `memberAvatar--fit-${fit}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      title={alt || undefined}
    >
      {hasImage ? (
        <img
          src={imageSrc!}
          alt={alt}
          draggable={false}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          className="memberAvatar__fallback"
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
        >
          {getFallback(fallback ?? alt)}
        </span>
      )}
    </span>
  );
}