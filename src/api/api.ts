import axios from "axios";

let authToken: string | null = null;

// ✅ no dev: passa pelo proxy do Vite
const baseURL = "/api";

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

// (se você usa interceptors/headers, mantém igual)
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export function setAuthToken(token: string | null) {
  authToken = token;
}
