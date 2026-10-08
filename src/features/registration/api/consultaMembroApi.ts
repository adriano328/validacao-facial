import type { AxiosResponse } from "axios";
import { api } from "@shared/api/client";

export interface ConsultaEleitorRequest {
  documento: string;
}

export interface ConsultaEleitorResponse {
  NOME: string;
  MINISTERIO: string;
  DOCUMENTO_TIPO: string;
  DOCUMENTO: string;
  NASCIMENTO: string;
  EMAIL: string;
  CAMPO_ID: number | null;
  CAMPO: string;
  REGIAO_ID: number | null;
  REGIAO: string;
}

type ConsultaEleitorApiResponse =
  | ConsultaEleitorResponse
  | Partial<ConsultaEleitorResponse>
  | null
  | "";

export async function consultaMembro(
  payload: ConsultaEleitorRequest,
  signal?: AbortSignal,
): Promise<ConsultaEleitorResponse | null> {
  const response: AxiosResponse<ConsultaEleitorApiResponse> = await api.post(
    "/comademat/consulta",
    payload,
    { signal },
  );

  if (
    !response.data ||
    typeof response.data !== "object" ||
    Object.keys(response.data).length === 0
  ) {
    return null;
  }

  return response.data as ConsultaEleitorResponse;
}
