import { api } from "@shared/api/client";
import type { PageResponse } from "@features/admin/api/cargoApi";

export type ComissaoCpe = {
  comissaoCpeId: number;
  convencaoId: number;
  nomeConvencao: string;
  usuarioId: number;
  nomeUsuario: string;
  cargoIdAdministrativo: number;
  nomeCargoAdministrativo: string;
  dataInicial: string;
  dataFinal?: string | null;
  statusAtivo: boolean;
};

export type ComissaoCpePayload = {
  convencaoId: number;
  usuarioId: number;
  cargoIdAdministrativo: number;
  dataInicial: string;
  dataFinal: string | null;
  statusAtivo: boolean;
};

export type ComissaoCpeFilters = {
  convencaoId?: number;
  membro?: string;
  cargoIdAdministrativo?: number;
  statusAtivo?: boolean;
};

export async function listarComissoesCpe(
  page: number,
  size: number,
  filters: ComissaoCpeFilters = {},
  signal?: AbortSignal
): Promise<PageResponse<ComissaoCpe>> {
  const response = await api.get<PageResponse<ComissaoCpe>>("/comissoes-cpe", {
    params: {
      page,
      size,
      convencaoId: filters.convencaoId,
      membro: filters.membro || undefined,
      cargoIdAdministrativo: filters.cargoIdAdministrativo,
      statusAtivo: filters.statusAtivo,
    },
    signal,
  });

  return response.data;
}

export async function cadastrarComissaoCpe(
  payload: ComissaoCpePayload
): Promise<void> {
  await api.post("/comissoes-cpe", payload);
}

export async function atualizarComissaoCpe(
  comissaoCpeId: number,
  payload: ComissaoCpePayload
): Promise<void> {
  await api.put(`/comissoes-cpe/${comissaoCpeId}`, payload);
}

export async function excluirComissaoCpe(
  comissaoCpeId: number
): Promise<void> {
  await api.delete(`/comissoes-cpe/${comissaoCpeId}`);
}
