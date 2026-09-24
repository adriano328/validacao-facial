import type { PageResponse } from "@features/admin/api/cargoApi";
import { api } from "@shared/api/client";

export type Evento = {
  eventoId: number;
  convencaoId: number;
  nomeConvencao: string;
  nomeEvento: string;
  dataInicial: string;
  dataFinal: string;
  statusAtivo: boolean;
};

export type EventoFilters = {
  convencaoId?: number;
  nomeEvento?: string;
  dataInicial?: string;
  dataFinal?: string;
  statusAtivo?: boolean;
};

export type EventoPayload = {
  convencaoId: number;
  dataInicial: string;
  dataFinal: string;
  nomeEvento: string;
  statusAtivo: boolean;
};

export async function listarEventos(
  page: number,
  size: number,
  filters: EventoFilters = {},
  signal?: AbortSignal
): Promise<PageResponse<Evento>> {
  const response = await api.get<PageResponse<Evento>>("/eventos", {
    params: {
      page,
      size,
      convencaoId: filters.convencaoId,
      nomeEvento: filters.nomeEvento || undefined,
      dataInicial: filters.dataInicial || undefined,
      dataFinal: filters.dataFinal || undefined,
      statusAtivo: filters.statusAtivo,
    },
    signal,
  });

  return response.data;
}

export async function cadastrarEvento(payload: EventoPayload): Promise<void> {
  await api.post("/eventos", payload);
}

export async function atualizarEvento(
  eventoId: number,
  payload: EventoPayload
): Promise<void> {
  await api.put(`/eventos/${eventoId}`, payload);
}

export async function excluirEvento(eventoId: number): Promise<void> {
  await api.delete(`/eventos/${eventoId}`);
}

export async function buscarEventoPorId(
  eventoId: number,
  signal?: AbortSignal
): Promise<Evento> {
  const response = await api.get<Evento>(`/eventos/${eventoId}`, { signal });

  return response.data;
}
