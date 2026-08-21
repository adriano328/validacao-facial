import type {
  DocumentCorner,
  DocumentQualityConfig,
} from "@features/document-verification/types/documentQuality";
import type { OpenCv } from "./loadOpenCv";

export type ImageQualityMeasurement = {
  sharpness: number;
  sharpnessValid: boolean;
  brightness: number;
  brightnessValid: boolean;
  glare: number;
  glareValid: boolean;
};

function getGlareBounds(
  corners: DocumentCorner[] | undefined,
  width: number,
  height: number
) {
  if (!corners?.length) {
    return { x: 0, y: 0, width, height };
  }

  const minX = Math.max(0, Math.floor(Math.min(...corners.map((corner) => corner.x))));
  const maxX = Math.min(width, Math.ceil(Math.max(...corners.map((corner) => corner.x))));
  const minY = Math.max(0, Math.floor(Math.min(...corners.map((corner) => corner.y))));
  const maxY = Math.min(height, Math.ceil(Math.max(...corners.map((corner) => corner.y))));

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

function measureGlare(canvas: HTMLCanvasElement, corners: DocumentCorner[] | undefined) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 1;

  const bounds = getGlareBounds(corners, canvas.width, canvas.height);
  const imageData = ctx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
  let glarePixels = 0;
  const totalPixels = imageData.data.length / 4;

  for (let index = 0; index < imageData.data.length; index += 4) {
    const red = imageData.data[index];
    const green = imageData.data[index + 1];
    const blue = imageData.data[index + 2];
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;

    if (luminance >= 245) {
      glarePixels += 1;
    }
  }

  return totalPixels > 0 ? glarePixels / totalPixels : 1;
}

export function measureImageQuality(
  cv: OpenCv,
  canvas: HTMLCanvasElement,
  corners: DocumentCorner[] | undefined,
  config: DocumentQualityConfig
): ImageQualityMeasurement {
  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  const laplacian = new cv.Mat();
  const mean = new cv.Mat();
  const stddev = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.Laplacian(gray, laplacian, cv.CV_64F);
    cv.meanStdDev(laplacian, mean, stddev);

    const brightness = cv.mean(gray)[0] ?? 0;
    const deviation = stddev.doubleAt(0, 0);
    const sharpness = deviation * deviation;
    const glare = measureGlare(canvas, corners);

    return {
      sharpness,
      sharpnessValid: sharpness >= config.sharpnessMin,
      brightness,
      brightnessValid:
        brightness >= config.brightnessMin && brightness <= config.brightnessMax,
      glare,
      glareValid: glare <= config.glareMax,
    };
  } finally {
    stddev.delete();
    mean.delete();
    laplacian.delete();
    gray.delete();
    src.delete();
  }
}
