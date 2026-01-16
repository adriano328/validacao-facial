import { api } from "../api/api";

export type CriarSessaoLivenessResponse = {
  idSessao: string;        // ajuste se o backend retornar outro nome
  sessionId?: string;      // opcional: caso o backend já retorne sessionId direto
};

export type ResultadoSessaoLivenessResponse = {
  status: string;
  sessionId: string;
  confidence: number,
  foto: string;
  score?: number;
  imagemUrl?: string;
  raw?: unknown;
};

export type CompararFacesRequest = {
  source: string;
  email: string;
};

export async function criarSessaoLiveness(signal?: AbortSignal) {
  const { data } = await api.post<CriarSessaoLivenessResponse>(
    "/liveness/criar-sessao",
    {}, 
    { signal }
  );
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
): Promise<number> {
  const { data } = await api.post<number>(
    "/liveness/comparar-faces",
    payload,
    { signal },
  );

  return data;
}