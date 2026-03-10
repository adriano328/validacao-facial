import { api } from "../api/api";
import type { PessoaPayload } from "../features/cadastro/types";

export async function salvarPessoa(payload: PessoaPayload, signal?: AbortSignal) {
    const { data } = await api.post('/usuario/salvar', payload, { signal });
    return data;
}