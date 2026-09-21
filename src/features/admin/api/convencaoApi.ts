import { api } from "@shared/api/client";

export type Convencao = {
  convencaoId: number;
  nomeConvencao: string;
  cnpj: string;
};

export async function listarConvencoes(signal?: AbortSignal): Promise<Convencao[]> {
  const response = await api.get<Convencao[]>("/convencoes", { signal });

  return response.data;
}
