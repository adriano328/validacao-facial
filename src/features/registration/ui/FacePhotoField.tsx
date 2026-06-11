import { useEffect, useRef, useState } from "react";
import "./FacePhotoField.css";

type Props = {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (base64: string) => void;
  disabled?: boolean;
  error?: string | null;
};

export function FacePhotoField({
  label = "Foto do rosto",
  required = true,
  value,
  onChange,
  disabled,
  error,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [openCamera, setOpenCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const hasValue = value.trim().length > 0;

  useEffect(() => {
    if (!openCamera) {
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        setCameraError(null);
        setReady(false);

        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Este navegador nao permite acessar a camera.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setCameraError("Nao foi possivel acessar a camera. Verifique as permissoes.");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [openCamera]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function closeCamera() {
    setOpenCamera(false);
    setReady(false);
    stopCamera();
  }

  function capturePhoto() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;
    const maxLongSide = 1600;
    const scale = Math.min(1, maxLongSide / Math.max(videoWidth, videoHeight));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(videoWidth * scale);
    canvas.height = Math.round(videoHeight * scale);

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    onChange(canvas.toDataURL("image/jpeg", 0.92));
    closeCamera();
  }

  return (
    <section className="facePhoto" aria-label={label}>
      <div className="facePhoto-preview">
        {hasValue ? (
          <img className="facePhoto-image" src={value} alt="Foto facial capturada" />
        ) : (
          <div className="facePhoto-empty" aria-hidden="true">
            <span className="facePhoto-emptyIcon">+</span>
          </div>
        )}
      </div>

      <div className="facePhoto-content">
        <div className="facePhoto-heading">
          <h3>
            {label}
            {required ? <span aria-hidden="true"> *</span> : null}
          </h3>
          <span className={`facePhoto-status ${hasValue ? "is-ok" : "is-pending"}`}>
            {hasValue ? "Ok" : "Obrigatorio"}
          </span>
        </div>

        <p>Capture uma foto frontal, bem iluminada e com o rosto centralizado.</p>

        <div className="facePhoto-actions">
          <button
            className="vf-button vf-button--primary facePhoto-button"
            type="button"
            disabled={disabled}
            onClick={() => setOpenCamera(true)}
          >
            {hasValue ? "Tirar novamente" : "Tirar foto"}
          </button>

          {hasValue ? (
            <button
              className="vf-button vf-button--secondary facePhoto-button"
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
            >
              Remover
            </button>
          ) : null}
        </div>

        {error ? <span className="facePhoto-error">{error}</span> : null}
      </div>

      {openCamera ? (
        <div className="faceCamera" role="dialog" aria-modal="true" aria-label="Capturar foto do rosto">
          <div className="faceCamera-shell">
            <header className="faceCamera-header">
              <strong>Foto do rosto</strong>
              <span>Use boa iluminacao e mantenha o rosto visivel.</span>
            </header>

            <div className="faceCamera-stage">
              {cameraError ? (
                <div className="faceCamera-error">{cameraError}</div>
              ) : (
                <>
                  <video className="faceCamera-video" ref={videoRef} playsInline muted />
                </>
              )}
            </div>

            <footer className="faceCamera-footer">
              <button className="faceCamera-button" type="button" onClick={closeCamera}>
                Cancelar
              </button>
              <button
                className="faceCamera-button faceCamera-button--primary"
                type="button"
                disabled={!ready || !!cameraError}
                onClick={capturePhoto}
              >
                Capturar
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </section>
  );
}
