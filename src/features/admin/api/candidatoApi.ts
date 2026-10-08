import type { PageResponse } from "@features/admin/api/cargoApi";
import { api } from "@shared/api/client";

export type Candidato = {
  candidatoId: number;
  eleicaoId: number;
  usuarioId: number;
  nomeUsuario: string;
  campoEclesiasticoId?: number | null;
  nomeCampoEclesiastico?: string | null;
  cargoIdEletivo: number;
  nomeCargoEletivo: string;
  numero: number;
  fotoContentType?: string | null;
  fotoUrl?: string | null;
};

export type CandidatoFilters = {
  eleicaoId: number;
  nomeUsuario?: string;
  cargoIdEletivo?: number;
  numero?: number;
  incluirFoto?: boolean;
};

export type CandidatoPayload = {
  eleicaoId: number;
  usuarioId: number;
  cargoIdEletivo: number;
  numero: number;
  foto: string | null;
  fotoContentType: string | null;
  removerFoto?: boolean;
};

export async function listarCandidatos(
  page: number,
  size: number,
  filters: CandidatoFilters,
  signal?: AbortSignal
): Promise<PageResponse<Candidato>> {
  const response = await api.get<PageResponse<Candidato>>("/candidatos", {
    params: {
      page,
      size,
      eleicaoId: filters.eleicaoId,
      nomeUsuario: filters.nomeUsuario || undefined,
      cargoIdEletivo: filters.cargoIdEletivo,
      numero: filters.numero,
      incluirFoto: filters.incluirFoto,
    },
    signal,
  });

  return response.data;
}

export async function buscarFotoUrlCandidato(
  eleicaoId: number,
  candidatoId: number,
  signal?: AbortSignal
): Promise<string | null> {
  const response = await api.get<{
    fotoUrl?: string | null;
  }>(`/eleicoes/${eleicaoId}/candidatos/${candidatoId}/foto-url`, {
    signal,
  });

  return response.data.fotoUrl ?? null;
}

export async function cadastrarCandidato(
  payload: CandidatoPayload
): Promise<void> {
  await api.post("/candidatos", payload);
}

export async function atualizarCandidato(
  candidatoId: number,
  payload: CandidatoPayload
): Promise<void> {
  await api.put(`/candidatos/${candidatoId}`, payload);
}

export async function excluirCandidato(candidatoId: number): Promise<void> {
  await api.delete(`/candidatos/${candidatoId}`);
}
