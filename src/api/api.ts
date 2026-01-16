import axios from "axios";

let authToken: string | null = null;

const baseURL = "https://ihvjqtwvo5.execute-api.us-east-1.amazonaws.com/test";

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export function setAuthToken(token: string | null) {
  authToken = token;
}
