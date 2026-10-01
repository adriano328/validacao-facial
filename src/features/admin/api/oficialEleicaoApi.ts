import type { PageResponse } from "@features/admin/api/cargoApi";
import { api } from "@shared/api/client";

export type OficialEleicao = {
  oficialEleicaoId: number;
  eleicaoId: number;
  nomeEvento: string;
  convencaoId: number;
  nomeConvencao: string;
  usuarioId: number;
  nomeUsuario: string;
  cargoIdAdministrativo: number;
  nomeCargoAdministrativo: string;
};

export type OficialEleicaoFilters = {
  eleicaoId: number;
  nomeUsuario?: string;
  cargoIdAdministrativo?: number;
};

export type OficialEleicaoPayload = {
  eleicaoId: number;
  usuarioId: number;
  cargoIdAdministrativo: number;
};

export async function listarOficiaisEleicao(
  page: number,
  size: number,
  filters: OficialEleicaoFilters,
  signal?: AbortSignal
): Promise<PageResponse<OficialEleicao>> {
  const response = await api.get<PageResponse<OficialEleicao>>(
    "/oficiais-eleicao",
    {
      params: {
        page,
        size,
        eleicaoId: filters.eleicaoId,
        nomeUsuario: filters.nomeUsuario || undefined,
        cargoIdAdministrativo: filters.cargoIdAdministrativo,
      },
      signal,
    }
  );

  return response.data;
}

export async function cadastrarOficialEleicao(
  payload: OficialEleicaoPayload
): Promise<void> {
  await api.post("/oficiais-eleicao", payload);
}

export async function atualizarOficialEleicao(
  oficialEleicaoId: number,
  payload: OficialEleicaoPayload
): Promise<void> {
  await api.put(`/oficiais-eleicao/${oficialEleicaoId}`, payload);
}

export async function excluirOficialEleicao(
  oficialEleicaoId: number
): Promise<void> {
  await api.delete(`/oficiais-eleicao/${oficialEleicaoId}`);
}
