import type { DocumentCorner, DocumentQualityConfig } from "@features/document-verification/types/documentQuality";
import type { OpenCv } from "./loadOpenCv";

export type DocumentDetection = {
  detected: boolean;
  corners: DocumentCorner[];
  area: number;
  coverage: number;
  fullyVisible: boolean;
};

const EMPTY_DETECTION: DocumentDetection = {
  detected: false,
  corners: [],
  area: 0,
  coverage: 0,
  fullyVisible: false,
};

function sortCorners(corners: DocumentCorner[]): DocumentCorner[] {
  const topLeft = corners.reduce((best, point) =>
    point.x + point.y < best.x + best.y ? point : best
  );
  const bottomRight = corners.reduce((best, point) =>
    point.x + point.y > best.x + best.y ? point : best
  );
  const topRight = corners.reduce((best, point) =>
    point.x - point.y > best.x - best.y ? point : best
  );
  const bottomLeft = corners.reduce((best, point) =>
    point.x - point.y < best.x - best.y ? point : best
  );

  return [topLeft, topRight, bottomRight, bottomLeft];
}

function cornersFromApprox(approx: { rows: number; data32S: Int32Array }): DocumentCorner[] {
  const corners: DocumentCorner[] = [];
  for (let index = 0; index < approx.rows; index += 1) {
    corners.push({
      x: approx.data32S[index * 2],
      y: approx.data32S[index * 2 + 1],
    });
  }
  return sortCorners(corners);
}

function isFullyVisible(
  corners: DocumentCorner[],
  width: number,
  height: number,
  marginRatio: number
) {
  const marginX = width * marginRatio;
  const marginY = height * marginRatio;

  return corners.every(
    (corner) =>
      corner.x >= marginX &&
      corner.x <= width - marginX &&
      corner.y >= marginY &&
      corner.y <= height - marginY
  );
}

export function detectDocument(
  cv: OpenCv,
  canvas: HTMLCanvasElement,
  config: DocumentQualityConfig
): DocumentDetection {
  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, config.cannyThreshold1, config.cannyThreshold2);
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let bestArea = 0;
    let bestCorners: DocumentCorner[] = [];
    const frameArea = canvas.width * canvas.height;

    for (let index = 0; index < contours.size(); index += 1) {
      const contour = contours.get(index);
      const approx = new cv.Mat();

      try {
        const perimeter = cv.arcLength(contour, true);
        cv.approxPolyDP(contour, approx, perimeter * config.polygonEpsilonRatio, true);

        if (approx.rows !== 4) {
          continue;
        }

        const area = cv.contourArea(approx);
        if (area <= frameArea * config.minDocumentAreaRatio || area <= bestArea) {
          continue;
        }

        bestArea = area;
        bestCorners = cornersFromApprox(approx);
      } finally {
        approx.delete();
        contour.delete();
      }
    }

    if (!bestCorners.length) {
      return EMPTY_DETECTION;
    }

    const coverage = bestArea / frameArea;

    return {
      detected: true,
      corners: bestCorners,
      area: bestArea,
      coverage,
      fullyVisible: isFullyVisible(
        bestCorners,
        canvas.width,
        canvas.height,
        config.borderMarginRatio
      ),
    };
  } finally {
    hierarchy.delete();
    contours.delete();
    edges.delete();
    blurred.delete();
    gray.delete();
    src.delete();
  }
}
