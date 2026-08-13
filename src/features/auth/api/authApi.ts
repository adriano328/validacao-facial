import { api } from "@shared/api/client";

type LoginPayload = {
  email: string;
  password: string;
};

type ApiMessageResponse = {
  message?: string;
  mensagem?: string;
};

export type SolicitarResetSenhaPayload = {
  email: string;
};

export type ResetarSenhaPayload = {
  token: string;
  novaSenha: string;
  confirmacaoSenha: string;
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

function getMessageFromResponse(data: unknown): string | undefined {
  if (typeof data === "string") return data;

  if (!data || typeof data !== "object") return undefined;

  const response = data as ApiMessageResponse;
  return response.message ?? response.mensagem;
}

export async function solicitarResetSenha(
  payload: SolicitarResetSenhaPayload,
  signal?: AbortSignal
): Promise<string> {
  const response = await api.post("/usuario/solicitar-reset-senha", payload, {
    signal,
  });

  return (
    getMessageFromResponse(response.data) ??
    "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha."
  );
}

export async function resetarSenha(
  payload: ResetarSenhaPayload,
  signal?: AbortSignal
): Promise<string> {
  const response = await api.post("/usuario/resetar-senha", payload, {
    signal,
  });

  return getMessageFromResponse(response.data) ?? "Senha redefinida com sucesso.";
}
