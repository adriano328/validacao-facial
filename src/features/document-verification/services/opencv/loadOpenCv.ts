const OPENCV_URL = "https://docs.opencv.org/4.10.0/opencv.js";
const OPENCV_SCRIPT_SELECTOR = 'script[data-opencv-js="true"]';

export type OpenCvMat = {
  rows: number;
  cols: number;
  data32S: Int32Array;
  delete: () => void;
  doubleAt: (row: number, col: number) => number;
};

export type OpenCvMatVector = {
  size: () => number;
  get: (index: number) => OpenCvMat;
  delete: () => void;
};

export type OpenCv = {
  Mat: new () => OpenCvMat;
  MatVector: new () => OpenCvMatVector;
  Size: new (width: number, height: number) => unknown;
  imread: (source: HTMLCanvasElement) => OpenCvMat;
  cvtColor: (src: OpenCvMat, dst: OpenCvMat, code: number) => void;
  GaussianBlur: (
    src: OpenCvMat,
    dst: OpenCvMat,
    ksize: unknown,
    sigmaX: number,
    sigmaY?: number,
    borderType?: number
  ) => void;
  Canny: (
    src: OpenCvMat,
    dst: OpenCvMat,
    threshold1: number,
    threshold2: number
  ) => void;
  findContours: (
    image: OpenCvMat,
    contours: OpenCvMatVector,
    hierarchy: OpenCvMat,
    mode: number,
    method: number
  ) => void;
  contourArea: (contour: OpenCvMat, oriented?: boolean) => number;
  arcLength: (curve: OpenCvMat, closed: boolean) => number;
  approxPolyDP: (
    curve: OpenCvMat,
    approxCurve: OpenCvMat,
    epsilon: number,
    closed: boolean
  ) => void;
  Laplacian: (
    src: OpenCvMat,
    dst: OpenCvMat,
    ddepth: number,
    ksize?: number,
    scale?: number,
    delta?: number,
    borderType?: number
  ) => void;
  meanStdDev: (src: OpenCvMat, mean: OpenCvMat, stddev: OpenCvMat) => void;
  mean: (src: OpenCvMat) => number[];
  COLOR_RGBA2GRAY: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  CV_64F: number;
};

type OpenCvRuntime = OpenCv & {
  onRuntimeInitialized?: () => void;
};

declare global {
  interface Window {
    cv?: Partial<OpenCvRuntime>;
  }
}

let openCvPromise: Promise<OpenCv> | null = null;

function isOpenCvReady(cv: unknown): cv is OpenCvRuntime {
  const candidate = cv as Partial<OpenCv> | undefined;

  return Boolean(
    candidate &&
      typeof candidate.Mat === "function" &&
      typeof candidate.imread === "function" &&
      typeof candidate.findContours === "function"
  );
}

function waitForRuntime(resolve: (cv: OpenCv) => void, reject: (reason: Error) => void) {
  const cv = window.cv;

  if (isOpenCvReady(cv)) {
    resolve(cv);
    return;
  }

  if (!cv) {
    reject(new Error("OpenCV não inicializou."));
    return;
  }

  const previousHandler = cv.onRuntimeInitialized;
  cv.onRuntimeInitialized = () => {
    previousHandler?.();
    if (isOpenCvReady(window.cv)) {
      resolve(window.cv);
      return;
    }
    reject(new Error("OpenCV carregou sem runtime disponível."));
  };
}

export function loadOpenCv(): Promise<OpenCv> {
  if (isOpenCvReady(window.cv)) {
    return Promise.resolve(window.cv);
  }

  if (openCvPromise) {
    return openCvPromise;
  }

  openCvPromise = new Promise<OpenCv>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(OPENCV_SCRIPT_SELECTOR);

    if (existingScript) {
      existingScript.addEventListener("load", () => waitForRuntime(resolve, reject), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Falha ao carregar OpenCV.")),
        { once: true }
      );
      if (window.cv) {
        waitForRuntime(resolve, reject);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = OPENCV_URL;
    script.async = true;
    script.dataset.opencvJs = "true";
    script.addEventListener("load", () => waitForRuntime(resolve, reject), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Falha ao carregar OpenCV.")),
      { once: true }
    );
    document.head.appendChild(script);
  });

  return openCvPromise;
}
