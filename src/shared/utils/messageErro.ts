// src/utils/handleAxiosError.ts
import axios, { AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string;
};

export function handleAxiosError(error: unknown): string {
  // Erro do Axios
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // mensagem vinda do backend
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // status HTTP sem message
    if (axiosError.response?.status) {
      return `Erro ${axiosError.response.status}. Não foi possível concluir a solicitação.`;
    }

    // erro de rede / timeout
    if (axiosError.code === "ECONNABORTED") {
      return "Tempo de resposta excedido. Tente novamente.";
    }

    return "Erro de comunicação com o servidor.";
  }

  // Erro genérico
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro inesperado.";
}
