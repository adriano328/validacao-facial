import { api } from "@shared/api/client";

export type Parametro = {
  parametroId: number;
  convencaoId: number;
  nomeConvencao: string;
  cargoIdPresidenteCpe: number;
  nomeCargoPresidenteCpe: string;
  cargoIdSecretarioCpe: number;
  nomeCargoSecretarioCpe: string;
  cargoIdMembroCpe: number;
  nomeCargoMembroCpe: string;
};

export type ParametroFilters = {
  convencaoId?: number;
};

export type ParametroUpdateRequest = {
  convencaoId: number;
  cargoIdPresidenteCpe: number;
  cargoIdSecretarioCpe: number;
  cargoIdMembroCpe: number;
};

export async function listarParametros(
  filters: ParametroFilters = {},
  signal?: AbortSignal
): Promise<Parametro[]> {
  const response = await api.get<Parametro[]>("/parametros", {
    params: {
      convencaoId: filters.convencaoId,
    },
    signal,
  });

  return response.data;
}

export async function atualizarParametro(
  parametroId: number,
  payload: ParametroUpdateRequest
): Promise<void> {
  await api.put(`/parametros/${parametroId}`, payload);
}
