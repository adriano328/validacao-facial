import { api } from "../api/api";

export type CriarSessaoLivenessResponse = {
  idSessao: string;        // ajuste se o backend retornar outro nome
  sessionId?: string;      // opcional: caso o backend já retorne sessionId direto
};

export type ResultadoSessaoLivenessResponse = {
  status: string;          // ex: "SUCCEEDED" | "FAILED" etc (ajuste conforme seu backend)
  score?: number;          // se houver
  imagemUrl?: string;      // se houver
  raw?: unknown;           // opcional (se backend mandar payload bruto)
};

export async function criarSessaoLiveness(signal?: AbortSignal) {
  const { data } = await api.post<CriarSessaoLivenessResponse>(
    "/liveness/criar-sessao",
    {}, // POST sem body
    { signal }
  );
  return data;
}

export async function obterResultadoSessaoLiveness(
  idSessao: string,
  idPessoa: string,
  signal?: AbortSignal
) {
  const { data } = await api.get<ResultadoSessaoLivenessResponse>(
    `/liveness/resultado-sessao/${encodeURIComponent(idSessao)}/${encodeURIComponent(idPessoa)}`,
    { signal }
  );
  return data;
}
