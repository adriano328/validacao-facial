import { api } from "@shared/api/client";
import type { PageResponse } from "@features/admin/api/cargoApi";

export type MesaDiretora = {
  mesaDiretoraId: number;
  convencaoId: number;
  nomeConvencao: string;
  usuarioId: number;
  nomeUsuario: string;
  cargoIdAdministrativo: number;
  nomeCargoAdministrativo: string;
  dataInicial: string;
  dataFinal?: string | null;
};

export type MesaDiretoraPayload = {
  convencaoId: number;
  usuarioId: number;
  cargoIdAdministrativo: number;
  dataInicial: string;
  dataFinal: string | null;
};

export type MesaDiretoraFilters = {
  convencaoId?: number;
  nomeMembro?: string;
  cargoIdAdministrativo?: number;
};

export async function listarMesasDiretoras(
  page: number,
  size: number,
  filters: MesaDiretoraFilters = {},
  signal?: AbortSignal
): Promise<PageResponse<MesaDiretora>> {
  const response = await api.get<PageResponse<MesaDiretora>>("/mesas-diretoras", {
    params: {
      page,
      size,
      convencaoId: filters.convencaoId,
      nomeMembro: filters.nomeMembro || undefined,
      cargoIdAdministrativo: filters.cargoIdAdministrativo,
    },
    signal,
  });

  return response.data;
}

export async function cadastrarMesaDiretora(
  payload: MesaDiretoraPayload
): Promise<void> {
  await api.post("/mesas-diretoras", payload);
}

export async function atualizarMesaDiretora(
  mesaDiretoraId: number,
  payload: MesaDiretoraPayload
): Promise<void> {
  await api.put(`/mesas-diretoras/${mesaDiretoraId}`, payload);
}

export async function excluirMesaDiretora(
  mesaDiretoraId: number
): Promise<void> {
  await api.delete(`/mesas-diretoras/${mesaDiretoraId}`);
}
