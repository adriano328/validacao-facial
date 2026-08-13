import { api } from "@shared/api/client";

type LoginPayload = {
  email: string;
  password: string;
};

function getTokenFromResponse(data: unknown): string | undefined {
  if (typeof data === "string") return data;

  if (!data || typeof data !== "object") return undefined;

  const record = data as Record<string, unknown>;
  const tokenFields = ["token", "accessToken", "access_token", "tokenAcesso"];

  for (const field of tokenFields) {
    const value = record[field];
    if (typeof value === "string" && value.trim()) return value;
  }

  return undefined;
}

export async function login(
  payload: LoginPayload,
  signal?: AbortSignal
): Promise<string> {
  const response = await api.post("/usuario/login", payload, { signal });
  const token = getTokenFromResponse(response.data);

  if (!token) {
    throw new Error("Token de autenticação não retornado pela API de login.");
  }

  return token;
}
