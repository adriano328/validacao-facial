// src/api/api.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

let authToken: string | null = localStorage.getItem("token-valid-person");

const STORAGE_KEY = "token-valid-person";
const baseURL = "https://ihvjqtwvo5.execute-api.us-east-1.amazonaws.com/test";

export type ApiErrorResponse = {
  message?: string;
  mensagem?: string;
  error?: string;
  errors?: string[];
};

export type NormalizedApiError = AxiosError<ApiErrorResponse> & {
  normalizedMessage: string;
};

export const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authToken || localStorage.getItem(STORAGE_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      clearAuthToken();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const normalizedMessage =
      data?.message ||
      data?.mensagem ||
      data?.error ||
      data?.errors?.[0] ||
      error.message ||
      "Erro inesperado na requisição.";

    const normalizedError = Object.assign(error, {
      normalizedMessage,
    }) as NormalizedApiError;

    return Promise.reject(normalizedError);
  },
);

export function setAuthToken(token: string | null) {
  authToken = token;

  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

export function getAuthToken() {
  return authToken || localStorage.getItem(STORAGE_KEY);
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem(STORAGE_KEY);
}

export function getApiErrorMessage(error: unknown): string {
  const apiError = error as Partial<NormalizedApiError> & {
    message?: string;
  };

  return (
    apiError?.normalizedMessage ||
    apiError?.message ||
    "Erro inesperado."
  );
}