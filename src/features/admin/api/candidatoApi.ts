import type { PageResponse } from "@features/admin/api/cargoApi";
import { api } from "@shared/api/client";

export type Candidato = {
  candidatoId: number;
  eleicaoId: number;
  usuarioId: number;
  nomeUsuario: string;
  cargoIdEletivo: number;
  nomeCargoEletivo: string;
  numero: number;
  foto?: string | null;
  fotoContentType?: string | null;
};

export type CandidatoFilters = {
  eleicaoId: number;
  nomeUsuario?: string;
  cargoIdEletivo?: number;
  numero?: number;
};

export type CandidatoPayload = {
  eleicaoId: number;
  usuarioId: number;
  cargoIdEletivo: number;
  numero: number;
  foto: string | null;
  fotoContentType: string | null;
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
    },
    signal,
  });

  return response.data;
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
