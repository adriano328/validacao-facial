import type { AxiosResponse } from "axios";
import { api } from "../api/api";

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
  CAMPO_ID: number;
  CAMPO: string;
}

export async function consultaMembro(
  payload: ConsultaEleitorRequest,
  signal?: AbortSignal,
): Promise<ConsultaEleitorResponse> {
  const response: AxiosResponse<ConsultaEleitorResponse> = await api.post(
    "/comademat/consulta",
    payload,
    { signal },
  );

  return response.data;
}
