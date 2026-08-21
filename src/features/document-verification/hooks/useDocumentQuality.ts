import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { detectDocument } from "@features/document-verification/services/opencv/documentDetector";
import { measureImageQuality } from "@features/document-verification/services/opencv/imageQuality";
import { loadOpenCv } from "@features/document-verification/services/opencv/loadOpenCv";
import type { OpenCv } from "@features/document-verification/services/opencv/loadOpenCv";
import {
  DOCUMENT_QUALITY_CONFIG,
  INITIAL_DOCUMENT_QUALITY,
} from "@features/document-verification/types/documentQuality";
import type {
  DocumentCorner,
  DocumentQualityResult,
} from "@features/document-verification/types/documentQuality";

type UseDocumentQualityParams = {
  enabled: boolean;
  ready: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  frameRef: RefObject<HTMLElement | null>;
};

type UseDocumentQualityReturn = {
  quality: DocumentQualityResult;
  openCvReady: boolean;
  loadError: string | null;
};

function videoHasFrame(video: HTMLVideoElement) {
  return (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  );
}

function distanceBetweenCorners(current: DocumentCorner[], previous: DocumentCorner[]) {
  const totalDistance = current.reduce((sum, corner, index) => {
    const previousCorner = previous[index];
    if (!previousCorner) return sum + Number.MAX_SAFE_INTEGER;

    return sum + Math.hypot(corner.x - previousCorner.x, corner.y - previousCorner.y);
  }, 0);

  return totalDistance / current.length;
}

function getQualityMessage(result: Omit<DocumentQualityResult, "message" | "valid">) {
  if (!result.documentDetected || !result.documentFullyVisible) {
    return "Posicione o documento dentro da área indicada.";
  }

  if (!result.coverageValid) {
    return "Aproxime o documento da câmera.";
  }

  if (!result.sharpnessValid) {
    return "Imagem desfocada. Mantenha a câmera parada.";
  }

  if (!result.brightnessValid) {
    return result.brightness < DOCUMENT_QUALITY_CONFIG.brightnessMin
      ? "Melhore a iluminação."
      : "Reduza a iluminação direta no documento.";
  }

  if (!result.glareValid) {
    return "Reflexo detectado. Incline levemente o documento.";
  }

  if (!result.stable) {
    return "Mantenha a câmera parada e aguarde o foco.";
  }

  return "Documento pronto para captura.";
}

function drawFrameToCanvas(
  video: HTMLVideoElement,
  frame: HTMLElement,
  canvas: HTMLCanvasElement
) {
  if (!videoHasFrame(video)) return false;

  const videoRect = video.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();

  if (!videoRect.width || !videoRect.height || !frameRect.width || !frameRect.height) {
    return false;
  }

  const scaleX = video.videoWidth / videoRect.width;
  const scaleY = video.videoHeight / videoRect.height;
  const sourceX = Math.max(0, Math.round((frameRect.left - videoRect.left) * scaleX));
  const sourceY = Math.max(0, Math.round((frameRect.top - videoRect.top) * scaleY));
  const sourceWidth = Math.min(
    video.videoWidth - sourceX,
    Math.round(frameRect.width * scaleX)
  );
  const sourceHeight = Math.min(
    video.videoHeight - sourceY,
    Math.round(frameRect.height * scaleY)
  );

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return false;
  }

  const scale = Math.min(
    1,
    DOCUMENT_QUALITY_CONFIG.maxAnalysisLongSide / Math.max(sourceWidth, sourceHeight)
  );

  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    video,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return true;
}

export function useDocumentQuality({
  enabled,
  ready,
  videoRef,
  frameRef,
}: UseDocumentQualityParams): UseDocumentQualityReturn {
  const [quality, setQuality] = useState<DocumentQualityResult>(INITIAL_DOCUMENT_QUALITY);
  const [openCvReady, setOpenCvReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const cvRef = useRef<OpenCv | null>(null);
  const lastAnalysisRef = useRef(0);
  const previousCornersRef = useRef<DocumentCorner[] | null>(null);
  const stableFramesRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setQuality(INITIAL_DOCUMENT_QUALITY);
      setOpenCvReady(false);
      setLoadError(null);
      cvRef.current = null;
      previousCornersRef.current = null;
      stableFramesRef.current = 0;
      return;
    }

    let cancelled = false;
    let rafId = 0;
    const analysisCanvas = document.createElement("canvas");

    setQuality({
      ...INITIAL_DOCUMENT_QUALITY,
      message: "Carregando validação do documento...",
    });

    loadOpenCv()
      .then((cv) => {
        if (cancelled) return;
        cvRef.current = cv;
        setOpenCvReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError("Validação da câmera indisponível neste dispositivo.");
        setQuality({
          ...INITIAL_DOCUMENT_QUALITY,
          message: "Validação da câmera indisponível neste dispositivo.",
        });
      });

    const analyze = (timestamp: number) => {
      if (cancelled) return;

      if (
        cvRef.current &&
        ready &&
        timestamp - lastAnalysisRef.current >= DOCUMENT_QUALITY_CONFIG.analysisIntervalMs
      ) {
        lastAnalysisRef.current = timestamp;

        const video = videoRef.current;
        const frame = frameRef.current;
        if (video && frame && drawFrameToCanvas(video, frame, analysisCanvas)) {
          const detection = detectDocument(
            cvRef.current,
            analysisCanvas,
            DOCUMENT_QUALITY_CONFIG
          );
          const imageQuality = measureImageQuality(
            cvRef.current,
            analysisCanvas,
            detection.corners,
            DOCUMENT_QUALITY_CONFIG
          );

          if (!detection.detected) {
            previousCornersRef.current = null;
            stableFramesRef.current = 0;
          } else if (previousCornersRef.current) {
            const distance = distanceBetweenCorners(
              detection.corners,
              previousCornersRef.current
            );
            stableFramesRef.current =
              distance <= DOCUMENT_QUALITY_CONFIG.stableCornerDelta
                ? stableFramesRef.current + 1
                : 1;
            previousCornersRef.current = detection.corners;
          } else {
            previousCornersRef.current = detection.corners;
            stableFramesRef.current = 1;
          }

          const stable = stableFramesRef.current >= DOCUMENT_QUALITY_CONFIG.stableFrameCount;
          const partialResult = {
            documentDetected: detection.detected,
            documentFullyVisible: detection.fullyVisible,
            sharpness: imageQuality.sharpness,
            sharpnessValid: imageQuality.sharpnessValid,
            brightness: imageQuality.brightness,
            brightnessValid: imageQuality.brightnessValid,
            glare: imageQuality.glare,
            glareValid: imageQuality.glareValid,
            coverage: detection.coverage,
            coverageValid: detection.coverage >= DOCUMENT_QUALITY_CONFIG.coverageMin,
            stable,
          };
          const valid =
            partialResult.documentDetected &&
            partialResult.documentFullyVisible &&
            partialResult.coverageValid &&
            partialResult.sharpnessValid &&
            partialResult.brightnessValid &&
            partialResult.glareValid &&
            partialResult.stable;

          setQuality({
            ...partialResult,
            valid,
            message: getQualityMessage(partialResult),
          });
        }
      }

      rafId = window.requestAnimationFrame(analyze);
    };

    rafId = window.requestAnimationFrame(analyze);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      previousCornersRef.current = null;
      stableFramesRef.current = 0;
    };
  }, [enabled, frameRef, ready, videoRef]);

  return { quality, openCvReady, loadError };
}
