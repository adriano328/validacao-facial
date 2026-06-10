import { api } from "@shared/api/client";

export type ConsultaCpfResponse = {
  foto: string;
  cpf: string;
  nome: string;
  dataNascimento: string;
  telefone: string;
  cargo: string;
  email: string;
  status: string;
  mensagem: string;
};

export async function consultarCpf(
  cpf: string,
  signal?: AbortSignal
): Promise<ConsultaCpfResponse> {
  const { data } = await api.get<ConsultaCpfResponse>(
    "/usuario/consulta-cpf",
    {
      params: { cpf },
      signal,
    }
  );

  return data;
}
