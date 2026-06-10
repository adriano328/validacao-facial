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

export type ConfirmarUsuarioRequest = {
  cpf: string;
};

export type ConfirmarUsuarioResponse = Partial<ConsultaCpfResponse> & {
  mensagem?: string;
  message?: string;
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

export async function confirmarUsuario(
  payload: ConfirmarUsuarioRequest,
  signal?: AbortSignal
): Promise<ConfirmarUsuarioResponse> {
  const { data } = await api.put<ConfirmarUsuarioResponse>(
    "/usuario/confirmar-usuario",
    payload,
    { signal }
  );

  return data;
}
