import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

const baseURL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV
    ? "/api"
    : "https://ihvjqtwvo5.execute-api.us-east-1.amazonaws.com/test");

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

const publicPaths = [
  "/usuario/salvar",
  "/usuario/login",
  "/comademat/consulta",
  "/usuario/two-factor-ativado",
  "/usuario/confirmar-email",
  "/usuario/ativar-two-factor",
  "/usuario/confirmar-two-factor",
  "/usuario/verificar-two-factor",
  "/usuario/consulta-cpf",
];

type JwtPayload = {
  exp?: number;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized.padEnd(normalized.length + padLength, "=");

  return atob(padded);
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");

    if (parts.length < 2) {
      return null;
    }

    const payload = decodeBase64Url(parts[1]);
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

function isPublicPath(url?: string): boolean {
  if (!url) return false;

  try {
    const pathname = new URL(url, baseURL).pathname;
    return publicPaths.some((path) => pathname === path);
  } catch {
    return publicPaths.some((path) => url.startsWith(path));
  }
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (isPublicPath(config.url)) {
    return config;
  }

  if (!authToken) {
    return config;
  }

  if (isTokenExpired(authToken)) {
    authToken = null;
    unauthorizedHandler?.();
    return Promise.reject(new Error("Token expirado"));
  }

  config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      authToken = null;
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  }
);
