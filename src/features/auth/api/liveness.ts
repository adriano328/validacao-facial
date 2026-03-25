import { api } from "../../../api/api";

export type CriarSessaoLivenessResponse = {
  idSessao: string;
  sessionId?: string;
};

export type ResultadoSessaoLivenessResponse = {
  status: string;
  sessionId: string;
  confidence: number;
  foto: string;
  score?: number;
  imagemUrl?: string;
  raw?: unknown;
};

export type TokenResponse = {
  token: string;
};

export type CompararFacesRequest = {
  source: string;
  email: string;
  senha: string;
};

export async function criarSessaoLiveness(signal?: AbortSignal) {
  const { data } = await api.post<CriarSessaoLivenessResponse>(
    "/liveness/criar-sessao", {}, { signal }, );
  return data;
}

export async function obterResultadoSessaoLiveness(
  idSessao: string,
  idPessoa?: string,
  signal?: AbortSignal,
) {
  const base = `/liveness/resultado-sessao/${encodeURIComponent(idSessao)}`;
  const url = idPessoa
    ? `${base}/${encodeURIComponent(idPessoa)}`
    : base;
  const { data } = await api.get<ResultadoSessaoLivenessResponse>(url, {
    signal,
  });

  return data;
}

export async function compararFaces(
  payload: CompararFacesRequest,
  signal?: AbortSignal,
): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>(
    "/liveness/comparar-faces",
    payload,
    { signal },
  );

  return data;
}