import { api } from "@shared/api/client";
import type { PessoaPayload } from "@features/registration/model/types";

export async function salvarPessoa(payload: PessoaPayload, signal?: AbortSignal) {
    const { data } = await api.post('/usuario/salvar', payload, { signal });
    return data;
}

export async function confirmarEmail(codigo: string, signal?: AbortSignal) {
  const { data } = await api.put(
    "/usuario/confirmar-email",
    { codigo },
    { signal }
  );

  return data;
}
