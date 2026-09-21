import { api } from "@shared/api/client";

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type CargoResponse = {
  cargoId: number;
  convencaoId: number;
  nomeConvencao: string;
  nomeCargo: string;
  statusAtivo: boolean;
  tipoCargo: number;
  descricaoTipoCargo: string;
};

export type CargoPayload = {
  convencaoId: number;
  nomeCargo: string;
  statusAtivo: boolean;
  tipoCargo: number;
};

export type TipoCargo = {
  codigo: number;
  descricao: string;
};

export type Convencao = {
  convencaoId: number;
  nomeConvencao: string;
  cnpj: string;
};

export async function listarCargos(
  page: number,
  size: number,
  nomeCargo?: string,
  signal?: AbortSignal
): Promise<PageResponse<CargoResponse>> {
  const response = await api.get<PageResponse<CargoResponse>>("/cargos", {
    params: {
      page,
      size,
      nomeCargo: nomeCargo || undefined,
    },
    signal,
  });

  return response.data;
}

export async function cadastrarCargo(payload: CargoPayload): Promise<void> {
  await api.post("/cargos", payload);
}

export async function atualizarCargo(
  cargoId: number,
  payload: CargoPayload
): Promise<void> {
  await api.put(`/cargos/${cargoId}`, payload);
}

export async function excluirCargo(cargoId: number): Promise<void> {
  await api.delete(`/cargos/${cargoId}`);
}

export async function listarTiposCargo(
  signal?: AbortSignal
): Promise<TipoCargo[]> {
  const response = await api.get<TipoCargo[]>("/cargos/tipos", { signal });

  return response.data;
}

export async function listarConvencoes(
  signal?: AbortSignal
): Promise<Convencao[]> {
  const response = await api.get<Convencao[]>("/convencoes", { signal });

  return response.data;
}
