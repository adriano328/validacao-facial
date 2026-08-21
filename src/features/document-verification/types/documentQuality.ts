export type DocumentCorner = {
  x: number;
  y: number;
};

export type DocumentQualityResult = {
  valid: boolean;
  documentDetected: boolean;
  documentFullyVisible: boolean;
  sharpness: number;
  sharpnessValid: boolean;
  brightness: number;
  brightnessValid: boolean;
  glare: number;
  glareValid: boolean;
  coverage: number;
  coverageValid: boolean;
  stable: boolean;
  message?: string;
};

export type DocumentQualityConfig = {
  coverageMin: number;
  sharpnessMin: number;
  brightnessMin: number;
  brightnessMax: number;
  glareMax: number;
  borderMarginRatio: number;
  stableFrameCount: number;
  stableCornerDelta: number;
  analysisIntervalMs: number;
  maxAnalysisLongSide: number;
  cannyThreshold1: number;
  cannyThreshold2: number;
  polygonEpsilonRatio: number;
  minDocumentAreaRatio: number;
};

export const DOCUMENT_QUALITY_CONFIG: DocumentQualityConfig = {
  coverageMin: 0.55,
  sharpnessMin: 120,
  brightnessMin: 55,
  brightnessMax: 210,
  glareMax: 0.12,
  borderMarginRatio: 0.015,
  stableFrameCount: 5,
  stableCornerDelta: 18,
  analysisIntervalMs: 260,
  maxAnalysisLongSide: 640,
  cannyThreshold1: 70,
  cannyThreshold2: 180,
  polygonEpsilonRatio: 0.025,
  minDocumentAreaRatio: 0.22,
};

export const INITIAL_DOCUMENT_QUALITY: DocumentQualityResult = {
  valid: false,
  documentDetected: false,
  documentFullyVisible: false,
  sharpness: 0,
  sharpnessValid: false,
  brightness: 0,
  brightnessValid: false,
  glare: 0,
  glareValid: false,
  coverage: 0,
  coverageValid: false,
  stable: false,
  message: "Posicione o documento dentro da área indicada.",
};
