import { api } from "@shared/api/client";

export type ConsultaCpfResponse = {
  foto?: string | null;
  cpf?: string | null;
  nome?: string | null;
  dataNascimento?: string | null;
  telefone?: string | null;
  cargo?: string | null;
  email?: string | null;
  status?: string | null;
  mensagem?: string | null;
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
