// src/utils/handleAxiosError.ts
import axios, { AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string;
  mensagem?: string;
  error?: string;
};

export function handleAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    const apiMessage =
      axiosError.response?.data?.message ??
      axiosError.response?.data?.mensagem ??
      axiosError.response?.data?.error;

    if (apiMessage) {
      return apiMessage;
    }

    if (axiosError.response?.status) {
      return `Erro ${axiosError.response.status}. Não foi possível concluir a solicitação.`;
    }

    if (axiosError.code === "ECONNABORTED") {
      return "Tempo de resposta excedido. Tente novamente.";
    }

    if (axiosError.message) {
      return axiosError.message;
    }

    return "Erro de comunicação com o servidor.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Erro inesperado.";
}
