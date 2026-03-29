import axios from "axios";
import {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

const baseURL = "https://ihvjqtwvo5.execute-api.us-east-1.amazonaws.com/test";

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

type JwtPayload = {
  exp?: number;
  sub?: string;
  username?: string;
  authorities?: string[];
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

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

export function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!authToken) {
      return config;
    }

    if (isTokenExpired(authToken)) {
      authToken = null;
      onUnauthorized?.();

      return Promise.reject(
        new AxiosError("Token expirado", "ERR_TOKEN_EXPIRED", config),
      );
    }

    config.headers.Authorization = `Bearer ${authToken}`;
    return config;
  },
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      authToken = null;
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);