import type { PageResponse } from "@features/admin/api/cargoApi";
import { api } from "@shared/api/client";

export type Eleicao = {
  eleicaoId: number;
  eventoId: number;
  nomeEvento: string;
  convencaoId: number;
  nomeConvencao: string;
  dataInicial: string;
  dataFinal: string;
  dataInicioVotacao: string;
  dataInicioApuracao: string;
  chavePublica?: string | null;
  fingerprint?: string | null;
  tamanhoBits?: number | null;
  dataCadastro: string;
};

export type EleicaoFilters = {
  convencaoId?: number;
  eventoId?: number;
  dataInicial?: string;
  dataFinal?: string;
  dataInicioVotacao?: string;
  dataInicioApuracao?: string;
};

export type EleicaoPayload = {
  eventoId: number;
  dataInicial: string;
  dataFinal: string;
  dataInicioVotacao: string;
  dataInicioApuracao: string;
  chavePublica: string | null;
  fingerprint: string | null;
  tamanhoBits: number | null;
  dataCadastro: string;
};

export async function listarEleicoes(
  page: number,
  size: number,
  filters: EleicaoFilters = {},
  signal?: AbortSignal
): Promise<PageResponse<Eleicao>> {
  const response = await api.get<PageResponse<Eleicao>>("/eleicoes", {
    params: {
      page,
      size,
      convencaoId: filters.convencaoId,
      eventoId: filters.eventoId,
      dataInicial: filters.dataInicial || undefined,
      dataFinal: filters.dataFinal || undefined,
      dataInicioVotacao: filters.dataInicioVotacao || undefined,
      dataInicioApuracao: filters.dataInicioApuracao || undefined,
    },
    signal,
  });

  return response.data;
}

export async function cadastrarEleicao(payload: EleicaoPayload): Promise<void> {
  await api.post("/eleicoes", payload);
}

export async function atualizarEleicao(
  eleicaoId: number,
  payload: EleicaoPayload
): Promise<void> {
  await api.put(`/eleicoes/${eleicaoId}`, payload);
}

export async function excluirEleicao(eleicaoId: number): Promise<void> {
  await api.delete(`/eleicoes/${eleicaoId}`);
}

export async function buscarEleicaoPorId(
  eleicaoId: number,
  signal?: AbortSignal
): Promise<Eleicao> {
  const response = await api.get<Eleicao>(`/eleicoes/${eleicaoId}`, { signal });

  return response.data;
}
