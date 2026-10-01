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

export type SelectOptionDto = {
  id: number;
  nome: string;
};

export type EventoCamposParticipantes = {
  eventoId: number;
  campoEclesiasticoIds: number[];
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

export async function buscarCamposParticipantesDoEvento(
  eventoId: number,
  signal?: AbortSignal
): Promise<EventoCamposParticipantes> {
  const response = await api.get<EventoCamposParticipantes>(
    `/eventos/${eventoId}/campos-eclesiasticos`,
    { signal }
  );

  return response.data;
}

export async function atualizarCamposParticipantesDoEvento(
  eventoId: number,
  campoEclesiasticoIds: number[]
): Promise<void> {
  await api.put(`/eventos/${eventoId}/campos-eclesiasticos`, {
    campoEclesiasticoIds,
  });
}

export async function listarRegioesPorConvencao(
  convencaoId: number,
  signal?: AbortSignal
): Promise<SelectOptionDto[]> {
  const response = await api.get<SelectOptionDto[]>("/regioes", {
    params: { convencaoId },
    signal,
  });

  return response.data;
}

export async function listarCamposEclesiasticosPorRegiao(
  regiaoId: number,
  signal?: AbortSignal
): Promise<SelectOptionDto[]> {
  const response = await api.get<SelectOptionDto[]>("/campos-eclesiasticos", {
    params: { regiaoId },
    signal,
  });

  return response.data;
}
