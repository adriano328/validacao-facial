import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DocumentType } from "@features/document-verification/model/types";

type Props = {
  open: boolean;
  documentType: DocumentType; // CNH | RG
  onClose: () => void;
  onCapture: (file: File) => void;
};

type FrameSpec = {
  title: string;
  subtitle: string;
  aspect: number; // largura / altura
  widthRatio: number; // 0..1
};

function getFrameSpec(type: DocumentType): FrameSpec {
  const base = { aspect: 1.58, widthRatio: 0.78 };

  if (type === "CNH") {
    return {
      ...base,
      title: "CNH",
      subtitle: "Posicione a CNH inteira dentro da moldura. Evite reflexos e borrões.",
    };
  }

  return {
    ...base,
    title: "RG/CNH",
    subtitle: "Posicione o documento inteiro dentro da moldura. Deixe bem nítido e sem cortes.",
  };
}

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Tenta aplicar melhorias no track (quando suportado)
async function enhanceTrack(track: MediaStreamTrack) {
  try {
    // Alguns browsers expõem capabilities; outros não.
    const anyTrack = track as any;
    const caps = typeof anyTrack.getCapabilities === "function" ? anyTrack.getCapabilities() : null;

    const advanced: any[] = [];

    // Preferir foco contínuo se suportado (Android/Chrome geralmente)
    if (caps?.focusMode?.includes?.("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }

    // Preferir exposição contínua se suportado
    if (caps?.exposureMode?.includes?.("continuous")) {
      advanced.push({ exposureMode: "continuous" });
    }

    // Torch só se você quiser ligar lanterna; aqui só deixo preparado (não liga sozinho)
    // if (caps?.torch) advanced.push({ torch: true });

    if (advanced.length) {
      await anyTrack.applyConstraints({ advanced });
    }
  } catch {
    // ignore (não suportado)
  }
}

export function DocumentCameraCapture({ open, documentType, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const spec = useMemo(() => getFrameSpec(documentType), [documentType]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function start() {
      try {
        setError(null);
        setReady(false);

        // 🎯 Constraints melhores: tenta alta resolução
        const constraints: MediaStreamConstraints = {
          video: {
            ...(isMobile() ? { facingMode: { ideal: "environment" } } : {}),
            // tenta 4K/2K; se não suportar, cai para o máximo possível
            width: { ideal: 4096 },
            height: { ideal: 2160 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // melhora autofocus/exposure quando possível
        const track = stream.getVideoTracks()[0];
        if (track) enhanceTrack(track);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // ✅ garante que metadata carregou (videoWidth/videoHeight corretos)
          await new Promise<void>((resolve) => {
            const v = videoRef.current!;
            const onLoaded = () => {
              v.removeEventListener("loadedmetadata", onLoaded);
              resolve();
            };
            v.addEventListener("loadedmetadata", onLoaded);
          });

          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError("Não foi possível acessar a câmera. Verifique permissões e HTTPS.");
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  function capture() {
    const video = videoRef.current;
    const frame = frameRef.current;
    if (!video || !frame) return;

    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;

    const videoRect = video.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();

    const scaleX = vw / videoRect.width;
    const scaleY = vh / videoRect.height;

    const sx = Math.max(0, Math.round((frameRect.left - videoRect.left) * scaleX));
    const sy = Math.max(0, Math.round((frameRect.top - videoRect.top) * scaleY));

    const sw = Math.min(vw - sx, Math.round(frameRect.width * scaleX));
    const sh = Math.min(vh - sy, Math.round(frameRect.height * scaleY));

    // 🔥 Upscale leve melhora leitura de texto
    const UPSCALE = 1.25;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw * UPSCALE);
    canvas.height = Math.round(sh * UPSCALE);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 🔥 melhora nitidez
    ctx.imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = "high";

    ctx.drawImage(
      video,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `${documentType}-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.95 // 🔥 melhor qualidade para documento
    );
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div style={styles.title}>{spec.title}</div>
          <div style={styles.subtitle}>{spec.subtitle}</div>
        </div>

        <div style={styles.cameraArea}>
          {error ? (
            <div style={{ color: "#fff", padding: 16 }}>{error}</div>
          ) : (
            <div style={styles.videoWrap}>
              <video ref={videoRef} playsInline muted style={styles.video} />

              <div
                ref={frameRef}
                style={{
                  ...styles.frame,
                  width: `min(${Math.round(spec.widthRatio * 100)}%, 640px)`,
                  aspectRatio: String(spec.aspect),
                }}
              />

              <div
                style={{
                  ...styles.mask,
                  width: `min(${Math.round(spec.widthRatio * 100)}%, 640px)`,
                  aspectRatio: String(spec.aspect),
                }}
              />
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button type="button" onClick={onClose} style={btn(false)}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={!ready || !!error}
            style={btn(true, !ready || !!error)}
          >
            Capturar
          </button>
        </div>
      </div>
    </div>
  );
}

function btn(primary: boolean, disabled?: boolean): React.CSSProperties {
  return {
    minWidth: 124,
    minHeight: 46,
    padding: "12px 18px",
    borderRadius: 12,
    border: "1px solid",
    borderColor: primary ? "#5b8cff" : "rgba(255,255,255,0.35)",
    background: primary ? "#2563eb" : "rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: primary ? 700 : 600,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    zIndex: 9999,
    display: "grid",
    placeItems: "center",
    padding: "max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom))",
  },
  shell: {
    width: "min(920px, 96vw)",
    height: "min(680px, 92vh)",
    background: "#0b0b0b",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
  },
  header: { padding: "14px 16px", background: "#050505", color: "#fff" },
  title: { fontSize: 17, fontWeight: 800 },
  subtitle: { fontSize: 13, opacity: 0.86, marginTop: 3, lineHeight: 1.35 },
  cameraArea: { position: "relative", flex: 1, background: "#000" },
  videoWrap: { position: "relative", width: "100%", height: "100%" },
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    background: "#000",
  },
  frame: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    borderRadius: 18,
    border: "3px solid rgba(255,255,255,0.94)",
    boxShadow: "0 0 0 1px rgba(37,99,235,0.8), inset 0 0 0 1px rgba(0,0,0,0.25)",
    zIndex: 7,
    pointerEvents: "none",
  },
  mask: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    borderRadius: 18,
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
    zIndex: 5,
    pointerEvents: "none",
  },
  footer: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    padding: "14px 16px calc(14px + env(safe-area-inset-bottom))",
    background: "#050505",
    flexWrap: "wrap",
  },
};
